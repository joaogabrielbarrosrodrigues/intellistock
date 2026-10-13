import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !senha) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, senha);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível entrar. Confira seus dados."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={styles.container}>
      <View style={styles.brand}><Text style={styles.logo}>InteliStock</Text><Text style={styles.subtitle}>Controle de estoque e compras</Text></View>
      <View style={styles.form}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput accessibilityLabel="E-mail" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" onChangeText={setEmail} onSubmitEditing={() => void handleLogin()} placeholder="joao@example.com" returnKeyType="next" style={styles.input} value={email} />
        <Text style={styles.label}>Senha</Text>
        <TextInput accessibilityLabel="Senha" onChangeText={setSenha} onSubmitEditing={() => void handleLogin()} placeholder="Sua senha" returnKeyType="go" secureTextEntry style={styles.input} value={senha} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={loading} onPress={() => void handleLogin()} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, justifyContent: "center", padding: 22 },
  brand: { marginBottom: 30 },
  logo: { color: colors.primaryDark, fontSize: 34, fontWeight: "900" },
  subtitle: { color: colors.muted, fontSize: 16, marginTop: 4 },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, gap: 10, padding: 18 },
  label: { color: colors.text, fontWeight: "700" },
  input: { borderColor: colors.border, borderRadius: 8, borderWidth: 1, color: colors.text, minHeight: 48, paddingHorizontal: 12 },
  error: { color: colors.danger, lineHeight: 20 },
  button: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 8, minHeight: 48, justifyContent: "center", marginTop: 4 },
  buttonPressed: { backgroundColor: colors.primaryDark },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }
});
