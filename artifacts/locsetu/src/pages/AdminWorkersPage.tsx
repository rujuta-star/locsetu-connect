import { motion } from "framer-motion";
import { useListPendingVerifications, useVerifyWorker, getListPendingVerificationsQueryKey, getGetAdminStatsQueryKey } from "@/lib/api-compat";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, CheckCircle, XCircle, MapPin, Briefcase } from "lucide-react";

export default function AdminWorkersPage() {
  const qc = useQueryClient();
  const { data: workers, isLoading } = useListPendingVerifications();

  const verifyWorker = useVerifyWorker({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPendingVerificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      }
    }
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-bold">Worker Verifications</h1>
        {(workers?.length ?? 0) > 0 && (
          <Badge className="bg-amber-500 text-white">{workers?.length} pending</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : !workers || workers.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">All clear!</h2>
          <p className="text-muted-foreground text-sm">No pending verification requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workers.map((worker: Record<string, any>, i: number) => (
            <motion.div key={worker.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={worker.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {worker.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{worker.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{worker.location || "No location"}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(worker.skills ?? []).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs capitalize">{skill}</Badge>
                        ))}
                      </div>

                      {worker.experience && (
                        <div className="flex items-center gap-1 mt-2">
                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{worker.experience} experience</span>
                        </div>
                      )}

                      {worker.bio && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{worker.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => verifyWorker.mutate({ workerId: worker.userId, status: "approved" })}
                      disabled={verifyWorker.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive border-destructive/30"
                      onClick={() => verifyWorker.mutate({ workerId: worker.userId, status: "rejected" })}
                      disabled={verifyWorker.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
