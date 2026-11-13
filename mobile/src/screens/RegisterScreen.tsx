import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { register } from "../api/intellistock";
import { AuthLayout, AuthNotice } from "../components/AuthLayout";
import { Button, TextField } from "../components/ui";
import type { AuthStackParamList } from "../navigation/RootNavigator";

export function RegisterScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, "Register">) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [codigoAcesso, setCodigoAcesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  async function handleRegister() {
    if (submitting.current) return;
    if (!nome.trim() || !email.trim() || !senha || !confirmacao || !codigoAcesso.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (senha.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setError("As senhas não coincidem.");
      return;
    }
    submitting.current = true;
    setError(null);
    setLoading(true);
    try {
      await register({ nome: nome.trim(), email: email.trim(), senha, codigoAcesso });
      navigation.popTo("Login", { email: email.trim(), cadastroConcluido: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível criar sua conta. Tente novamente."));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout description="Informe seus dados e o código de acesso fornecido pela empresa." title="Criar conta">
      <TextField label="Nome" value={nome} onChangeText={setNome} editable={!loading} autoCapitalize="words" maxLength={120} returnKeyType="next" />
      <TextField label="E-mail" value={email} onChangeText={setEmail} editable={!loading} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={180} returnKeyType="next" />
      <TextField label="Senha" value={senha} onChangeText={setSenha} editable={!loading} secureTextEntry placeholder="Pelo menos 8 caracteres" returnKeyType="next" />
      <TextField label="Confirmar senha" value={confirmacao} onChangeText={setConfirmacao} editable={!loading} secureTextEntry returnKeyType="next" />
      <TextField label="Código de acesso" value={codigoAcesso} onChangeText={setCodigoAcesso} editable={!loading} secureTextEntry autoCapitalize="none" autoCorrect={false} onSubmitEditing={() => void handleRegister()} returnKeyType="go" />
      <AuthNotice message={error} tone="error" />
      <Button title="Criar conta" loading={loading} onPress={() => void handleRegister()} />
      <Button title="Voltar para o login" variant="secondary" disabled={loading} onPress={() => navigation.goBack()} />
    </AuthLayout>
  );
}
