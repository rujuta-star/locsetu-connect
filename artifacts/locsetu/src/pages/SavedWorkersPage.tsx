import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import WorkerCard from "@/components/WorkerCard";
import { useListSavedWorkers } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Heart, Search } from "lucide-react";

export default function SavedWorkersPage() {
  const [, navigate] = useLocation();
  const { data: savedWorkers, isLoading } = useListSavedWorkers();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold">Saved Workers</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !savedWorkers || savedWorkers.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No saved workers yet</h2>
          <p className="text-muted-foreground mb-6">Save workers you like for quick access later</p>
          <Button onClick={() => navigate("/search")} className="gap-2">
            <Search className="w-4 h-4" /> Browse Workers
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedWorkers.map((worker, i) => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <WorkerCard worker={worker} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
