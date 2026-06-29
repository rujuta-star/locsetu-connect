import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useListBuzz, type BuzzPost } from "@workspace/api-client-react";
import { getDeleteBuzzMutationOptions, getCreateBuzzMutationOptions } from "@/lib/api-compat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Search, Plus, Trash2, Heart, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function BuzzCard({ post, onDelete, canDelete }: {
  post: BuzzPost;
  onDelete: (id: number) => void;
  canDelete: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {(post.userName ?? "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-sm">{post.userName ?? "Community Member"}</span>
            <div className="text-xs text-muted-foreground">
              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
            </div>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => onDelete(post.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <p className="text-sm text-foreground leading-relaxed">{post.content}</p>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post image"
          className="w-full rounded-xl object-cover max-h-52"
        />
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="w-3.5 h-3.5" />
          <span>{post.likesCount ?? 0} likes</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function BuzzPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [content, setContent] = useState("");

  const { data, isLoading } = useListBuzz();

  const posts = (data ?? []).filter(p =>
    !search || p.content.toLowerCase().includes(search.toLowerCase()) ||
    (p.userName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    ...getCreateBuzzMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/buzz"] });
      setDialogOpen(false);
      setContent("");
      toast({ title: t("postPosted"), description: t("postLive") });
    },
    onError: () => {
      toast({ title: t("error"), description: t("postError"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    ...getDeleteBuzzMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/buzz"] });
      toast({ title: t("delete"), description: t("postDeleted") });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: t("missingContent"), description: t("writeToShare"), variant: "destructive" });
      return;
    }
    createMutation.mutate({ data: { content } });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const canDeletePost = (post: BuzzPost) => {
    if (!user) return false;
    return user.role === "admin" || (user as any).id === post.userId;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-orange-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold">{t("localBuzz")}</h1>
          </div>
          <p className="text-white/80 text-sm max-w-lg">{t("buzzPageDesc")}</p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 border border-white/20">
              <Search className="w-4 h-4 text-white/70 flex-shrink-0" />
              <input
                type="text"
                placeholder={t("searchPosts")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm py-3 text-white placeholder:text-white/60"
              />
              {search && (
                <button onClick={() => setSearch("")}><X className="w-4 h-4 text-white/70" /></button>
              )}
            </div>
            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 px-5 rounded-xl h-auto py-3">
                    <Plus className="w-4 h-4" />
                    {t("postBuzz")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-primary" />
                      {t("postSomethingNew")}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div>
                      <Textarea
                        placeholder={t("contentPlaceholder")}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={5}
                        maxLength={1000}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">{content.length}/1000</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                        {t("cancel")}
                      </Button>
                      <Button type="submit" className="flex-1" disabled={createMutation.isPending || !content.trim()}>
                        {createMutation.isPending ? t("posting") : t("postBuzz")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            <strong>{posts.length}</strong> {posts.length === 1 ? t("postFound") : t("postsFound")} {search ? "" : t("postsInCommunity")}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-1" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">{t("noPostsYet")}</h3>
            <p className="text-muted-foreground text-sm">
              {search
                ? t("searchNoResults")
                : user
                ? t("noPostsYetDesc")
                : t("noPostsLoginDesc")}
            </p>
            {user && !search && (
              <Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" /> {t("postBuzz")}
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map(post => (
                <BuzzCard
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                  canDelete={canDeletePost(post)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {!user && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center"
          >
            <Megaphone className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground mb-1">{t("haveSomethingToShare")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("loginToPostBuzz")}</p>
            <div className="flex gap-2 justify-center">
              <a href="/login"><Button variant="outline" size="sm">{t("logIn")}</Button></a>
              <a href="/register"><Button size="sm">{t("signUpFree")}</Button></a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
