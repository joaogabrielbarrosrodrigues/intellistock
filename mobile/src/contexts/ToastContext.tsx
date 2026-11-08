import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText as Text } from "../components/AppText";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";

type ToastTone = "warning" | "success" | "error";
type ToastOptions = { title: string; message: string; tone?: ToastTone; duration?: number };
type ToastContextValue = { showToast: (options: ToastOptions) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    Animated.timing(opacity, { duration: 180, toValue: 0, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity]);

  const showToast = useCallback((options: ToastOptions) => {
    if (timeout.current) clearTimeout(timeout.current);
    setToast(options);
    opacity.setValue(0);
    Animated.timing(opacity, { duration: 180, toValue: 1, useNativeDriver: true }).start();
    timeout.current = setTimeout(hideToast, options.duration ?? 6000);
  }, [hideToast, opacity]);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
    opacity.stopAnimation();
  }, [opacity]);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const tone = toast?.tone ?? "warning";
  const icon = tone === "error" ? "alert-circle" : tone === "success" ? "checkmark-circle" : "warning";
  const toneStyle = tone === "error" ? styles.error : tone === "success" ? styles.success : styles.warning;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="box-none" style={[styles.host, { opacity, paddingTop: insets.top + spacing.sm }]}>
          <Pressable accessibilityRole="alert" onPress={hideToast} style={[styles.toast, toneStyle]}>
            <Ionicons color={tone === "warning" ? colors.warning : tone === "error" ? colors.danger : colors.success} name={icon} size={23} />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{toast.title}</Text>
              <Text style={styles.message}>{toast.message}</Text>
            </View>
            <Ionicons color={colors.muted} name="close" size={18} />
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return context;
}

const styles = StyleSheet.create({
  host: { left: 0, paddingHorizontal: spacing.md, position: "absolute", right: 0, top: 0, zIndex: 20 },
  toast: { alignItems: "center", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.sm, ...shadow.card },
  warning: { backgroundColor: colors.warningLight, borderColor: "#F4C98A" },
  success: { backgroundColor: colors.successLight, borderColor: colors.primaryLight },
  error: { backgroundColor: colors.dangerLight, borderColor: "#F2B8B5" },
  textBlock: { flex: 1, gap: 2 },
  title: { color: colors.text, fontWeight: "900" },
  message: { color: colors.textSecondary, lineHeight: 18 }
});
