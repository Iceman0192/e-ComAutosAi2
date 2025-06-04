import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Database, Plus, BarChart3, Download, Edit, Trash2, Calendar, User } from 'lucide-react';
import type { Dataset, InsertDataset } from '@shared/schema';

function CreateDatasetDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<InsertDataset>({
    name: '',
    description: '',
    tags: [],
    isPublic: false
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: InsertDataset) => {
      const response = await apiRequest('POST', '/api/datasets', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dataset created successfully"
      });
      setOpen(false);
      setFormData({ name: '', description: '', tags: [], isPublic: false });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Dataset creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create dataset",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Dataset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Dataset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Dataset Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter dataset name"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your dataset"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              }))}
              placeholder="luxury, sedan, analysis"
            />
          </div>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Dataset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DatasetCard({ dataset, onDelete, onExport }: { 
  dataset: Dataset; 
  onDelete: (id: number) => void;
  onExport: (id: number) => void;
}) {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/datasets/${dataset.id}/export`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataset.name}_export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "Dataset exported successfully"
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export dataset",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {dataset.name}
          </span>
          <Badge variant="secondary">{dataset.recordCount} records</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {dataset.description || 'No description'}
        </p>
        
        {dataset.tags && dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {dataset.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Calendar className="h-3 w-3" />
          Created {new Date(dataset.createdAt).toLocaleDateString()}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onDelete(dataset.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Datasets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datasets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This feature is restricted to admin users only.
            </p>
            <Badge variant="outline">Admin Access Required</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: datasets, isLoading } = useQuery({
    queryKey: ['/api/datasets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/datasets');
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/datasets/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dataset deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/datasets'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dataset",
        variant: "destructive"
      });
    }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/datasets'] });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = (id: number) => {
    // Export functionality is handled within DatasetCard component
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const datasetList = datasets?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Datasets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your vehicle data collections and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-red-600">
            ADMIN ONLY
          </Badge>
          <CreateDatasetDialog onSuccess={handleRefresh} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Plus className="h-5 w-5" />
              Create New Dataset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Start building a custom dataset from your search results
            </p>
            <CreateDatasetDialog onSuccess={handleRefresh} />
          </CardContent>
        </Card>

        {datasetList.map((dataset: Dataset) => (
          <DatasetCard
            key={dataset.id}
            dataset={dataset}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        ))}
      </div>

      {datasetList.length === 0 && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No datasets yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first dataset to start managing vehicle data collections
          </p>
          <CreateDatasetDialog onSuccess={handleRefresh} />
        </div>
      )}
    </div>
  );
}