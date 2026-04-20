import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { Cloud, ShieldCheck, UserPlus, Users } from "lucide-react";
import { ConsoleLayout } from "@/components/ConsoleLayout";
import {
  addOrganizationMember,
  createRole,
  listOrganizationMembers,
  listRoles,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/controlPlane";

type Member = {
  id: string;
  user_id: string;
  role: string;
  created_at: string | null;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
};

const IAM = () => {
  const { user, loading } = useAuth();
  const { organization, loading: workspaceLoading } = useWorkspace();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState("owner");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState("resource.read,resource.write");
  const [saving, setSaving] = useState(false);

  const fallbackRoles = useMemo(() => ["owner", "admin", "developer", "viewer"], []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const fetchIam = async () => {
    if (!organization?.id) return;
    const [membersResponse, rolesResponse] = await Promise.all([
      listOrganizationMembers(organization.id),
      listRoles(organization.id),
    ]);
    setMembers((membersResponse.data as Member[]) || []);
    setRoles((rolesResponse.data as Role[]) || []);
  };

  useEffect(() => {
    if (organization?.id) fetchIam();
  }, [organization?.id]);

  const handleAddMember = async () => {
    if (!organization?.id) return;
    if (!memberUserId.trim()) {
      toast.error("Member user ID is required");
      return;
    }
    setSaving(true);
    const { error } = await addOrganizationMember(organization.id, memberUserId.trim(), memberRole);
    if (error) toast.error("Failed to add member");
    else {
      toast.success("Member added");
      setMemberUserId("");
      fetchIam();
    }
    setSaving(false);
  };

  const handleRoleChange = async (member: Member, role: string) => {
    const { error } = await updateOrganizationMemberRole(member.id, role);
    if (error) toast.error("Failed to update role");
    else {
      toast.success("Role updated");
      fetchIam();
    }
  };

  const handleRemove = async (member: Member) => {
    const { error } = await removeOrganizationMember(member.id);
    if (error) toast.error("Failed to remove member");
    else {
      toast.success("Member removed");
      fetchIam();
    }
  };

  const handleCreateRole = async () => {
    if (!organization?.id) return;
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    const permissions = rolePermissions.split(",").map((p) => p.trim()).filter(Boolean);
    setSaving(true);
    const { error } = await createRole(organization.id, roleName.trim(), roleDescription.trim(), permissions);
    if (error) toast.error("Failed to create role");
    else {
      toast.success("Role created");
      setRoleName("");
      setRoleDescription("");
      setRolePermissions("resource.read,resource.write");
      fetchIam();
    }
    setSaving(false);
  };

  if (loading || workspaceLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-6 w-6 text-primary animate-pulse" />
      </div>
    );
  }

  const availableRoles = roles.length ? roles.map((role) => role.name.toLowerCase()) : fallbackRoles;

  return (
    <ConsoleLayout title="IAM">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Add Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Member User ID"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
              />
              <Input
                placeholder="Role (owner/admin/developer/viewer)"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
              />
              <Button onClick={handleAddMember} disabled={saving}>
                Add Member
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use the member's user ID from their profile. Roles map to RBAC permissions in the control plane.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.user_id}</p>
                    <p className="text-xs text-muted-foreground">Joined {member.created_at?.split("T")[0]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value)}
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(member)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Custom Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Role name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
            <Input
              placeholder="Permissions (comma separated)"
              value={rolePermissions}
              onChange={(e) => setRolePermissions(e.target.value)}
            />
            <Button onClick={handleCreateRole} disabled={saving}>
              Create Role
            </Button>
          </CardContent>
        </Card>
      </div>
    </ConsoleLayout>
  );
};

export default IAM;
