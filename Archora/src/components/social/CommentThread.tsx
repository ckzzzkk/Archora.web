import { DS } from '../../theme/designSystem';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { EmptyState } from '../common/EmptyState';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { supabase } from '../../utils/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import type { Comment } from '../../types';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReply?: (parentId: string, authorName: string) => void;
}

function CommentItem({ comment, depth = 0, onReply }: CommentItemProps) {
  const { colors } = useTheme();
  const [showReplies, setShowReplies] = useState(true);

  if (comment.isDeleted) {
    return (
      <View style={{ marginLeft: depth * 20, marginBottom: 8, opacity: 0.4 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, fontStyle: 'italic' }}>
          [deleted]
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.springify()} style={{ marginLeft: depth * 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Avatar */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primaryDim,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            flexShrink: 0,
          }}
        >
          {comment.authorAvatarUrl ? (
            <Image source={{ uri: comment.authorAvatarUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <Text style={{ color: DS.colors.background, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
              {comment.authorDisplayName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 3 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primary, fontWeight: '600' }}>
              {comment.authorDisplayName}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: DS.colors.primaryGhost, marginLeft: 6 }}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim, lineHeight: 20 }}>
            {comment.body}
          </Text>

          {/* Reply button */}
          {depth < 2 ? (
            <TouchableOpacity
              onPress={() => onReply?.(comment.id, comment.authorDisplayName)}
              style={{ marginTop: 4 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryGhost }}>
                Reply
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Replies */}
      {comment.replies.length > 0 ? (
        <>
          <TouchableOpacity
            onPress={() => setShowReplies((v) => !v)}
            style={{ marginLeft: 42, marginTop: 6 }}
          >
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}>
              {showReplies ? '▾' : '▸'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
          {showReplies
            ? comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
              ))
            : null}
        </>
      ) : null}
    </Animated.View>
  );
}

interface CommentThreadProps {
  templateId: string;
  comments: Comment[];
  loading?: boolean;
  onCommentPosted?: () => void;
}

export function CommentThread({ templateId, comments, loading = false, onCommentPosted }: CommentThreadProps) {
  const { colors } = useTheme();
  const { medium } = useHaptics();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [posting, setPosting] = useState(false);

  const handleReply = useCallback((parentId: string, authorName: string) => {
    setReplyTo({ id: parentId, name: authorName });
  }, []);

  const handlePost = async () => {
    if (!body.trim() || posting || !isAuthenticated) return;
    medium();
    setPosting(true);
    try {
      await supabase.from('comments').insert({
        template_id: templateId,
        body: body.trim(),
        parent_id: replyTo?.id ?? null,
      });
      setBody('');
      setReplyTo(null);
      onCommentPosted?.();
    } catch {
      // handle error silently
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        {[0, 1, 2].map((i) => <SkeletonLoader key={i} rows={2} showAvatar />)}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 16,
            color: DS.colors.primary,
            marginBottom: 16,
          }}
        >
          Comments ({comments.length})
        </Text>

        {comments.length === 0 ? (
          <EmptyState
            title="No comments yet"
            subtitle="Be the first to share your thoughts."
            compact
          />
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} onReply={handleReply} />
          ))
        )}

        {isAuthenticated ? (
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: DS.colors.border, paddingTop: 16 }}>
            {replyTo ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryGhost }}>
                  Replying to {replyTo.name}
                </Text>
                <TouchableOpacity onPress={() => setReplyTo(null)} style={{ marginLeft: 8 }}>
                  <Text style={{ color: DS.colors.primaryGhost }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <Input
              value={body}
              onChangeText={setBody}
              placeholder="Add a comment…"
              multiline
              numberOfLines={3}
            />
            <Button
              label={posting ? 'Posting…' : 'Post'}
              onPress={handlePost}
              disabled={!body.trim() || posting}
              variant="primary"
            />
          </View>
        ) : (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost, textAlign: 'center', marginTop: 16 }}>
            Sign in to leave a comment
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
