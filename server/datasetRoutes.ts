import type { Express } from "express";
import { db } from "./db";
import { datasets, datasetRecords, insertDatasetSchema, insertDatasetRecordSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export function registerDatasetRoutes(app: Express): void {
  // Get all datasets for admin
  app.get("/api/datasets", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const allDatasets = await db.select().from(datasets).orderBy(desc(datasets.createdAt));
      
      res.json({ 
        success: true, 
        data: allDatasets 
      });
    } catch (error) {
      console.error('Error fetching datasets:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch datasets" 
      });
    }
  });

  // Create new dataset
  app.post("/api/datasets", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const validatedData = insertDatasetSchema.parse(req.body);
      
      const [newDataset] = await db.insert(datasets).values({
        ...validatedData,
        createdBy: req.user.id
      }).returning();

      res.json({ 
        success: true, 
        data: newDataset 
      });
    } catch (error) {
      console.error('Error creating dataset:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid dataset data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to create dataset" 
      });
    }
  });

  // Update dataset
  app.put("/api/datasets/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const datasetId = parseInt(req.params.id);
      const validatedData = insertDatasetSchema.partial().parse(req.body);

      const [updatedDataset] = await db
        .update(datasets)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(datasets.id, datasetId))
        .returning();

      if (!updatedDataset) {
        return res.status(404).json({ success: false, message: "Dataset not found" });
      }

      res.json({ 
        success: true, 
        data: updatedDataset 
      });
    } catch (error) {
      console.error('Error updating dataset:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update dataset" 
      });
    }
  });

  // Delete dataset
  app.delete("/api/datasets/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const datasetId = parseInt(req.params.id);

      // Delete all records first
      await db.delete(datasetRecords).where(eq(datasetRecords.datasetId, datasetId));
      
      // Delete the dataset
      const [deletedDataset] = await db
        .delete(datasets)
        .where(eq(datasets.id, datasetId))
        .returning();

      if (!deletedDataset) {
        return res.status(404).json({ success: false, message: "Dataset not found" });
      }

      res.json({ 
        success: true, 
        message: "Dataset deleted successfully" 
      });
    } catch (error) {
      console.error('Error deleting dataset:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete dataset" 
      });
    }
  });

  // Add records to dataset
  app.post("/api/datasets/:id/records", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const datasetId = parseInt(req.params.id);
      const { records } = req.body;

      if (!Array.isArray(records)) {
        return res.status(400).json({ 
          success: false, 
          message: "Records must be an array" 
        });
      }

      // Insert records
      const datasetRecordsToInsert = records.map(record => ({
        datasetId,
        recordData: JSON.stringify(record)
      }));

      await db.insert(datasetRecords).values(datasetRecordsToInsert);

      // Update record count
      const [updatedDataset] = await db
        .update(datasets)
        .set({ 
          recordCount: records.length,
          updatedAt: new Date()
        })
        .where(eq(datasets.id, datasetId))
        .returning();

      res.json({ 
        success: true, 
        data: updatedDataset,
        message: `Added ${records.length} records to dataset` 
      });
    } catch (error) {
      console.error('Error adding records to dataset:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to add records to dataset" 
      });
    }
  });

  // Export dataset as CSV
  app.get("/api/datasets/:id/export", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      const datasetId = parseInt(req.params.id);

      // Get dataset info
      const [dataset] = await db.select().from(datasets).where(eq(datasets.id, datasetId));
      
      if (!dataset) {
        return res.status(404).json({ success: false, message: "Dataset not found" });
      }

      // Get all records
      const records = await db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId));

      if (records.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No records found in dataset" 
        });
      }

      // Parse record data and convert to CSV
      const parsedRecords = records.map(record => JSON.parse(record.recordData));
      
      // Get headers from first record
      const headers = Object.keys(parsedRecords[0]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      parsedRecords.forEach(record => {
        const row = headers.map(header => {
          const value = record[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',');
        csvContent += row + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}_export.csv"`);
      res.send(csvContent);

    } catch (error) {
      console.error('Error exporting dataset:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to export dataset" 
      });
    }
  });
}