import { useState, useEffect } from "react";
import { Users, UserPlus, Mail, Shield, Trash2, Crown, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
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

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  lastLogin?: string;
  invitedAt: string;
  invitedBy: string;
}

export default function Team() {
  const { user, hasPermission } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("basic");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageTeam = hasPermission(PERMISSIONS.TEAM_MANAGEMENT);
  const isEnterprise = user?.role === 'enterprise' || user?.role === 'admin';

  const roleColors = {
    admin: 'destructive',
    enterprise: 'default',
    platinum: 'secondary',
    gold: 'outline',
    basic: 'outline'
  } as const;

  const roleIcons = {
    admin: Crown,
    enterprise: Shield,
    platinum: Star,
    gold: Star,
    basic: Users
  };

  useEffect(() => {
    if (canManageTeam) {
      fetchTeamMembers();
    } else {
      setLoading(false);
    }
  }, [canManageTeam]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      setError("Failed to load team members");
      console.error('Team fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      setError("Please provide email and role");
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send invitation');
      }

      setInviteEmail("");
      setInviteRole("basic");
      await fetchTeamMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      await fetchTeamMembers();
    } catch (err) {
      setError("Failed to remove team member");
      console.error('Remove member error:', err);
    }
  };

  if (!canManageTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their access levels
          </p>
        </div>

        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Team Management requires an Enterprise plan. You're currently on the {user?.role || 'Freemium'} plan.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Enterprise</CardTitle>
            <CardDescription>
              Get team collaboration features and advanced access controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Invite unlimited team members</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Role-based access control</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Team usage analytics</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their access levels
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team with specific access level
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Access Level</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - Limited access</SelectItem>
                    <SelectItem value="gold">Gold - Advanced features</SelectItem>
                    <SelectItem value="platinum">Platinum - Premium access</SelectItem>
                    {isEnterprise && (
                      <SelectItem value="enterprise">Enterprise - Full access</SelectItem>
                    )}
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
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail}
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : members.filter(m => m.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Mail className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : members.filter(m => m.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Limit</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isEnterprise ? "Unlimited" : "5"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage access levels and remove team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No team members</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by inviting your first team member
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || Users;
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.name || member.email}</div>
                            {member.name && (
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleColors[member.role as keyof typeof roleColors] || 'outline'}>
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            member.status === 'active' ? 'default' :
                            member.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.lastLogin 
                            ? new Date(member.lastLogin).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(member.invitedAt).toLocaleDateString()}
                            <div className="text-muted-foreground">by {member.invitedBy}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.id.toString() !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}