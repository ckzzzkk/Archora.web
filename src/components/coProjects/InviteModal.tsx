import React, { useState } from 'react';
import { View, Text, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoProjectStore } from '../../stores/coProjectStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { OvalButton } from '../common/OvalButton';
import { CompassRoseLoader } from '../common/CompassRoseLoader';
import { DS } from '../../theme/designSystem';

interface Props {
  visible: boolean;
  onClose: () => void;
  projectId: string;
}

type RoleOption = 'editor' | 'viewer';

export function InviteModal({ visible, onClose, projectId }: Props) {
  const [TextInput] = React.useState(() => require('react-native').TextInput);
  const C = useThemeColors();
  const insets = useSafeAreaInsets();
  const { light } = useHaptics();
  const { inviteMember } = useCoProjectStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleOption>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    light();
    setLoading(true);
    setError(null);
    try {
      await inviteMember(projectId, email.trim(), role);
      setEmail('');
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to send invite');
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: DS.colors.overlay, justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: DS.colors.border,
            paddingHorizontal: DS.spacing.lg,
            paddingTop: DS.spacing.lg,
            paddingBottom: Math.max(DS.spacing.xxl, insets.bottom + DS.spacing.lg),
          }}>
            {/* Handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: 'rgba(240, 237, 232, 0.25)',
              alignSelf: 'center', marginBottom: DS.spacing.lg,
            }} />

            <Text style={{
              fontFamily: DS.font.heading, fontSize: 22, color: C.primary, marginBottom: DS.spacing.lg,
            }}>
              Invite to Co-Project
            </Text>

            {/* Email input */}
            <Text style={{
              fontFamily: DS.font.mono, fontSize: 11, color: C.primaryDim,
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: DS.spacing.xs,
            }}>
              Email address
            </Text>
            <TextInput
              value={email}
              onChangeText={(text: string) => { setEmail(text); setError(null); }}
              placeholder="colleague@asoria.app"
              placeholderTextColor={C.primaryGhost}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={{
                backgroundColor: C.background,
                borderRadius: DS.radius.input,
                borderWidth: 1, borderColor: error ? DS.colors.error : C.border,
                paddingHorizontal: DS.spacing.lg, paddingVertical: 14,
                fontFamily: DS.font.regular, fontSize: 15, color: C.primary,
                marginBottom: DS.spacing.md,
              }}
            />

            {/* Role selector */}
            <Text style={{
              fontFamily: DS.font.mono, fontSize: 11, color: C.primaryDim,
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: DS.spacing.xs,
            }}>
              Role
            </Text>
            <View style={{ flexDirection: 'row', gap: DS.spacing.sm, marginBottom: DS.spacing.lg }}>
              {(['editor', 'viewer'] as RoleOption[]).map((r) => (
                <View
                  key={r}
                  onTouchEnd={() => { light(); setRole(r); }}
                  style={{
                    flex: 1,
                    paddingVertical: DS.spacing.md,
                    borderRadius: DS.radius.small,
                    borderWidth: 1,
                    borderColor: role === r ? DS.colors.accent : C.border,
                    backgroundColor: role === r ? `${DS.colors.accent}10` : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: DS.font.semibold, fontSize: DS.fontSize.sm, color: role === r ? DS.colors.accent : C.primaryDim, textTransform: 'capitalize' }}>
                    {r}
                  </Text>
                  <Text style={{ fontFamily: DS.font.regular, fontSize: 10, color: C.primaryGhost, marginTop: 2 }}>
                    {r === 'editor' ? 'Can edit blueprint' : 'View only'}
                  </Text>
                </View>
              ))}
            </View>

            {error && (
              <Text style={{ fontFamily: DS.font.regular, fontSize: DS.fontSize.sm, color: DS.colors.error, marginBottom: DS.spacing.md }}>
                {error}
              </Text>
            )}

            <OvalButton
              label={loading ? '' : 'Send Invite'}
              variant="filled"
              onPress={handleInvite}
              loading={loading}
              disabled={!email.trim()}
              fullWidth
            />
            <OvalButton label="Cancel" variant="ghost" onPress={handleClose} fullWidth />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}