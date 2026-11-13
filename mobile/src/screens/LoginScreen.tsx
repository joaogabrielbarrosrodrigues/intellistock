import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../api/errors";
import { AppText as Text } from "../components/AppText";
import { BrandLogo } from "../components/BrandLogo";
import { Button, TextField } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import type { AuthStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";

export function LoginScreen({ navigation, route }: NativeStackScreenProps<AuthStackParamList, "Login">) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (route.params?.cadastroConcluido) {
      setEmail(route.params.email ?? "");
      setSenha("");
      setError(null);
      setSuccess(true);
      navigation.setParams({ cadastroConcluido: false });
    }
  }, [navigation, route.params]);

  async function handleLogin() {
    if (submitting.current) return;
    if (!email.trim() || !senha) return setError("Informe seu e-mail e sua senha.");
    submitting.current = true;
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await signIn(email.trim(), senha);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível entrar. Confira seus dados."));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.container}
      >
        <View style={styles.topGlow} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.brand}>
              <BrandLogo />
              <Text style={styles.subtitle}>Estoque e compras sob controle.</Text>
            </View>
            <View style={styles.form}>
              <Text style={styles.welcome}>Bem-vindo de volta</Text>
              <Text style={styles.description}>Entre para acompanhar sua operação.</Text>
              <TextField
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                keyboardType="email-address"
                label="E-mail"
                onChangeText={setEmail}
                placeholder="voce@empresa.com"
                returnKeyType="next"
                value={email}
              />
              <TextField
                editable={!loading}
                label="Senha"
                onChangeText={setSenha}
                onSubmitEditing={() => void handleLogin()}
                placeholder="Sua senha"
                returnKeyType="go"
                secureTextEntry
                value={senha}
              />
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              {success ? <Text accessibilityRole="alert" style={styles.success}>Conta criada! Entre com seu e-mail e senha.</Text> : null}
              <Button loading={loading} onPress={() => void handleLogin()} title="Entrar" />
              <Button disabled={loading} onPress={() => navigation.navigate("Register")} title="Criar conta" variant="secondary" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center" },
  topGlow: {
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 140,
    borderBottomRightRadius: 140,
    height: 260,
    left: 0,
    opacity: 0.85,
    position: "absolute",
    right: 0,
    top: 0
  },
  content: {
    alignSelf: "center",
    gap: spacing.xl,
    maxWidth: 520,
    padding: spacing.lg,
    width: "100%"
  },
  brand: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.sm,
    paddingVertical: spacing.lg
  },
  subtitle: { color: colors.textSecondary, fontSize: 14, paddingHorizontal: spacing.sm, textAlign: "center" },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow.card
  },
  welcome: { color: colors.text, fontSize: 22, fontWeight: "800" },
  description: { color: colors.muted, marginTop: -spacing.xs },
  error: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    color: colors.danger,
    padding: spacing.sm,
    textAlign: "center"
  },
  success: { backgroundColor: colors.successLight, borderRadius: radius.sm, color: colors.success, padding: spacing.sm, textAlign: "center" }
});
