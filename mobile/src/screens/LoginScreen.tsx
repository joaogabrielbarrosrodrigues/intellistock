import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { AuthLayout, AuthNotice } from "../components/AuthLayout";
import { Button, TextField } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import type { AuthStackParamList } from "../navigation/RootNavigator";

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
    <AuthLayout description="Entre para acompanhar sua operação." title="Bem-vindo de volta">
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
      <AuthNotice message={error} tone="error" />
      <AuthNotice message={success ? "Conta criada! Entre com seu e-mail e senha." : null} tone="success" />
      <Button loading={loading} onPress={() => void handleLogin()} title="Entrar" />
      <Button disabled={loading} onPress={() => navigation.navigate("Register")} title="Criar conta" variant="secondary" />
    </AuthLayout>
  );
}
