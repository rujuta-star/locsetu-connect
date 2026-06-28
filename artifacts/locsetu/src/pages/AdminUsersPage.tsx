import { useState } from "react";
import { motion } from "framer-motion";
import { useListAllUsers } from "@/lib/api-compat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  worker: "bg-blue-100 text-blue-700",
  customer: "bg-green-100 text-green-700",
};

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListAllUsers({
    role: roleFilter || undefined,
    page,
    limit: 20,
  });

  const users: any[] = data?.users ?? [];
  const filtered: any[] = search ? users.filter((u: any) => u.name.toLowerCase().includes(search.toLowerCase()) || (u.email ?? "").toLowerCase().includes(search.toLowerCase())) : users;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">All Users</h1>
        {data && <span className="text-muted-foreground text-sm">({data.total} total)</span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm py-2.5"
          />
        </div>
        <Select value={roleFilter || "all"} onValueChange={v => { setRoleFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="worker">Workers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No users found</div>
      ) : (
        <>
          <div className="space-y-2">
            {filtered.map((user, i) => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{user.name}</p>
                        <Badge className={`text-xs ${ROLE_COLORS[user.role]}`}>{user.role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email ?? user.phone ?? "No contact info"} · Joined {new Date(user.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">ID: {user.id}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {(data?.totalPages ?? 1) > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {data?.totalPages}
              </span>
              <Button variant="outline" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
