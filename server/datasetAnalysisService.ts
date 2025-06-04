import OpenAI from "openai";
import { db } from "./db";
import { datasets, datasetRecords } from "@shared/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DatasetQualityScore {
  overallScore: number;
  completenessScore: number;
  consistencyScore: number;
  diversityScore: number;
  recommendations: string[];
  issues: string[];
  strengths: string[];
}

export class DatasetAnalysisService {
  async analyzeDatasetQuality(datasetId: number): Promise<DatasetQualityScore> {
    try {
      // Get dataset info
      const [dataset] = await db.select().from(datasets).where(eq(datasets.id, datasetId));
      if (!dataset) {
        throw new Error('Dataset not found');
      }

      // Get all records
      const records = await db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId));

      if (records.length === 0) {
        return {
          overallScore: 0,
          completenessScore: 0,
          consistencyScore: 0,
          diversityScore: 0,
          recommendations: ['Add data records to begin quality analysis'],
          issues: ['No data records found'],
          strengths: []
        };
      }

      // Parse records
      const parsedRecords = records.map(record => {
        try {
          return JSON.parse(record.recordData);
        } catch (error) {
          return null;
        }
      }).filter(Boolean);

      // Prepare data sample for AI analysis
      const sampleSize = Math.min(10, parsedRecords.length);
      const dataSample = parsedRecords.slice(0, sampleSize);

      // Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt(dataset, parsedRecords, dataSample);

      // Get AI analysis
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a data quality expert specializing in automotive auction data analysis. 
            Analyze datasets for completeness, consistency, diversity, and provide actionable recommendations.
            Always respond with valid JSON in the exact format specified.`
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Validate and normalize scores
      return {
        overallScore: this.normalizeScore(analysis.overallScore),
        completenessScore: this.normalizeScore(analysis.completenessScore),
        consistencyScore: this.normalizeScore(analysis.consistencyScore),
        diversityScore: this.normalizeScore(analysis.diversityScore),
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        issues: Array.isArray(analysis.issues) ? analysis.issues : [],
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : []
      };

    } catch (error) {
      console.error('Dataset analysis error:', error);
      throw new Error('Failed to analyze dataset quality');
    }
  }

  private createAnalysisPrompt(dataset: any, allRecords: any[], sampleRecords: any[]): string {
    const fieldStats = this.calculateFieldStatistics(allRecords);
    
    return `
Analyze this automotive auction dataset for quality and provide recommendations:

Dataset Info:
- Name: ${dataset.name}
- Description: ${dataset.description || 'No description'}
- Total Records: ${allRecords.length}
- Tags: ${dataset.tags?.join(', ') || 'None'}

Field Statistics:
${JSON.stringify(fieldStats, null, 2)}

Sample Records (first ${sampleRecords.length}):
${JSON.stringify(sampleRecords, null, 2)}

Please analyze and return a JSON response with this exact structure:
{
  "overallScore": number (0-100),
  "completenessScore": number (0-100, based on missing fields and null values),
  "consistencyScore": number (0-100, based on data format consistency and value patterns),
  "diversityScore": number (0-100, based on variety in makes, models, years, prices, etc.),
  "recommendations": [
    "Specific actionable recommendations to improve data quality"
  ],
  "issues": [
    "Specific data quality issues found"
  ],
  "strengths": [
    "What this dataset does well"
  ]
}

Focus on automotive auction data quality factors:
- Price consistency and outliers
- VIN format validation
- Make/model standardization
- Date format consistency
- Geographic distribution
- Auction site representation
- Missing critical fields (VIN, price, make, model, year)
`;
  }

  private calculateFieldStatistics(records: any[]): any {
    if (records.length === 0) return {};

    const fieldStats: any = {};
    const allFields = new Set<string>();

    // Collect all possible fields
    records.forEach(record => {
      Object.keys(record).forEach(field => allFields.add(field));
    });

    // Calculate statistics for each field
    allFields.forEach(field => {
      const values = records.map(record => record[field]).filter(val => val != null && val !== '');
      const filledCount = values.length;
      const fillRate = (filledCount / records.length) * 100;
      
      fieldStats[field] = {
        fillRate: Math.round(fillRate),
        uniqueValues: new Set(values).size,
        sampleValues: values.slice(0, 3)
      };
    });

    return fieldStats;
  }

  private normalizeScore(score: any): number {
    const numScore = typeof score === 'number' ? score : parseFloat(score) || 0;
    return Math.max(0, Math.min(100, Math.round(numScore)));
  }

  async generateDatasetInsights(datasetId: number): Promise<string[]> {
    try {
      const [dataset] = await db.select().from(datasets).where(eq(datasets.id, datasetId));
      if (!dataset) {
        throw new Error('Dataset not found');
      }

      const records = await db
        .select()
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, datasetId));

      if (records.length === 0) {
        return ['No records available for insights generation'];
      }

      const parsedRecords = records.map(record => {
        try {
          return JSON.parse(record.recordData);
        } catch (error) {
          return null;
        }
      }).filter(Boolean);

      const insightsPrompt = `
Analyze this automotive auction dataset and provide 3-5 key business insights:

Dataset: ${dataset.name}
Records: ${parsedRecords.length}
Sample Data: ${JSON.stringify(parsedRecords.slice(0, 5), null, 2)}

Provide insights about:
- Market trends visible in the data
- Price patterns and opportunities
- Popular vehicle segments
- Auction performance indicators
- Geographic or temporal patterns

Return a JSON array of insight strings:
["Insight 1", "Insight 2", "Insight 3"]
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an automotive market analyst. Provide concise, actionable business insights based on auction data."
          },
          {
            role: "user",
            content: insightsPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      return Array.isArray(result.insights) ? result.insights : 
             Array.isArray(result) ? result : 
             ['Unable to generate insights from current data'];

    } catch (error) {
      console.error('Insights generation error:', error);
      return ['Error generating insights for this dataset'];
    }
  }
}

export const datasetAnalysisService = new DatasetAnalysisService();