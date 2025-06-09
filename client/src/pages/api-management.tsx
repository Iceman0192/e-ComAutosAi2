import { useState, useEffect } from "react";
import { Key, Globe, Shield, Activity, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: number;
  usage: {
    requests: number;
    limit: number;
    resetDate: string;
  };
  status: 'active' | 'inactive' | 'revoked';
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  rateLimit: number;
  authRequired: boolean;
  permissions: string[];
}

export default function APIManagement() {
  const { user, hasPermission } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [endpoints] = useState<APIEndpoint[]>([
    {
      path: "/api/cars",
      method: "GET",
      description: "Search active auction lots",
      rateLimit: 100,
      authRequired: true,
      permissions: ["BASIC_SEARCH"]
    },
    {
      path: "/api/sales-history",
      method: "GET", 
      description: "Get vehicle sales history",
      rateLimit: 50,
      authRequired: true,
      permissions: ["FRESH_SALES_HISTORY"]
    },
    {
      path: "/api/ai-lot-analysis",
      method: "POST",
      description: "AI-powered lot analysis",
      rateLimit: 10,
      authRequired: true,
      permissions: ["AI_ANALYSIS"]
    },
    {
      path: "/api/find-comparables",
      method: "POST",
      description: "Find comparable vehicles",
      rateLimit: 25,
      authRequired: true,
      permissions: ["SIMILAR_VEHICLES"]
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const canManageAPI = hasPermission('API_ACCESS');

  useEffect(() => {
    if (canManageAPI) {
      fetchAPIKeys();
    } else {
      setLoading(false);
    }
  }, [canManageAPI]);

  const fetchAPIKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setApiKeys(data.keys || []);
    } catch (err) {
      setError("Failed to load API keys");
      console.error('API keys error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName) {
      setError("API key name is required");
      return;
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      setNewKeyName("");
      setNewKeyPermissions([]);
      await fetchAPIKeys();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      await fetchAPIKeys();
    } catch (err) {
      setError("Failed to revoke API key");
      console.error('Revoke key error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'outline';
    }
  };

  if (!canManageAPI) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
          <p className="text-muted-foreground">
            Manage API keys, endpoints, and access controls
          </p>
        </div>

        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            API Management requires Enterprise plan or higher. You're currently on the {user?.role || 'Freemium'} plan.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Enterprise</CardTitle>
            <CardDescription>
              Get full API access and management capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span>Unlimited API keys</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Custom rate limits</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Usage analytics</span>
              </div>
              <Button className="w-full">Upgrade to Enterprise</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
          <p className="text-muted-foreground">
            Manage API keys, endpoints, and access controls
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key with specific permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="My Application"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="permissions">Permissions</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Search</SelectItem>
                    <SelectItem value="advanced">Advanced Analytics</SelectItem>
                    <SelectItem value="ai">AI Analysis</SelectItem>
                    <SelectItem value="full">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreateKey} disabled={!newKeyName}>
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your application API keys and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No API keys</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first API key to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <Badge variant={getStatusBadgeVariant(apiKey.status)}>
                          {apiKey.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKeys[apiKey.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(apiKey.createdAt).toLocaleDateString()} • 
                        Usage: {apiKey.usage.requests}/{apiKey.usage.limit} requests
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeKey(apiKey.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Available API endpoints and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Auth Required</TableHead>
                  <TableHead>Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <code className="text-sm">{endpoint.path}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell>{endpoint.description}</TableCell>
                    <TableCell>{endpoint.rateLimit}/min</TableCell>
                    <TableCell>
                      {endpoint.authRequired ? (
                        <Badge variant="default">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {endpoint.permissions.map((perm, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}