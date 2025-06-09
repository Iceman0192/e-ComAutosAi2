import { Express, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

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

// Mock team data for demonstration
const mockTeamMembers: TeamMember[] = [
  {
    id: 1,
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'enterprise',
    status: 'active',
    lastLogin: '2025-06-08T15:30:00Z',
    invitedAt: '2025-06-01T10:00:00Z',
    invitedBy: 'Admin User'
  },
  {
    id: 2,
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    role: 'platinum',
    status: 'active',
    lastLogin: '2025-06-07T09:15:00Z',
    invitedAt: '2025-06-02T14:30:00Z',
    invitedBy: 'Admin User'
  },
  {
    id: 3,
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    role: 'gold',
    status: 'pending',
    invitedAt: '2025-06-08T16:45:00Z',
    invitedBy: 'John Doe'
  }
];

export function setupTeamRoutes(app: Express) {
  /**
   * Get team members
   */
  app.get('/api/team/members', requireAuth, requireRole(['enterprise', 'admin']), asyncHandler(async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would query the database
      // filtered by the user's organization/team
      const members = mockTeamMembers;

      res.json({
        success: true,
        members
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team members'
      });
    }
  }));

  /**
   * Invite team member
   */
  app.post('/api/team/invite', requireAuth, requireRole(['enterprise', 'admin']), asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;
      const user = (req as any).user;

      if (!email || !role) {
        return res.status(400).json({
          success: false,
          message: 'Email and role are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate role
      const validRoles = ['basic', 'gold', 'platinum', 'enterprise'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      // Check if user already exists
      const existingMember = mockTeamMembers.find(member => member.email === email);
      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: 'User is already a team member'
        });
      }

      // Create new team member invitation
      const newMember: TeamMember = {
        id: mockTeamMembers.length + 1,
        email,
        name: '',
        role,
        status: 'pending',
        invitedAt: new Date().toISOString(),
        invitedBy: user.name || user.email
      };

      // In a real implementation, this would:
      // 1. Store the invitation in the database
      // 2. Send an invitation email
      // 3. Create a temporary invitation token
      mockTeamMembers.push(newMember);

      res.json({
        success: true,
        message: 'Invitation sent successfully',
        member: newMember
      });
    } catch (error) {
      console.error('Error inviting team member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation'
      });
    }
  }));

  /**
   * Remove team member
   */
  app.delete('/api/team/members/:memberId', requireAuth, requireRole(['enterprise', 'admin']), asyncHandler(async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const memberIdNum = parseInt(memberId);

      if (isNaN(memberIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid member ID'
        });
      }

      // Find member index
      const memberIndex = mockTeamMembers.findIndex(member => member.id === memberIdNum);
      if (memberIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      // Remove member
      mockTeamMembers.splice(memberIndex, 1);

      res.json({
        success: true,
        message: 'Team member removed successfully'
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove team member'
      });
    }
  }));

  /**
   * Update team member role
   */
  app.put('/api/team/members/:memberId/role', requireAuth, requireRole(['enterprise', 'admin']), asyncHandler(async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const { role } = req.body;
      const memberIdNum = parseInt(memberId);

      if (isNaN(memberIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid member ID'
        });
      }

      const validRoles = ['basic', 'gold', 'platinum', 'enterprise'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      // Find and update member
      const member = mockTeamMembers.find(member => member.id === memberIdNum);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      member.role = role;

      res.json({
        success: true,
        message: 'Member role updated successfully',
        member
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member role'
      });
    }
  }));
}