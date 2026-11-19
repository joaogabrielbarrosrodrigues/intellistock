/**
 * Título: Tela de cadastro
 * Explicação: Tela de criação de conta.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../api/errors";
import { register } from "../api/intellistock";
import { AppText as Text } from "../components/AppText";
import { BrandLogo } from "../components/BrandLogo";
import { Button, TextField } from "../components/ui";
import type { AuthStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";

/**
 * Título: Tela de cadastro (componente RegisterScreen)
 * Explicação: Campos de nome, e-mail, senha, confirmação e código de acesso. handleRegister(): confere
 *   se tudo foi preenchido, se a senha tem pelo menos 8 caracteres e se as duas senhas são iguais; envia
 *   o cadastro e, se der certo, volta ao login com o e-mail preenchido. Usado por RootNavigator.
 */
export function RegisterScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, "Register">) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [codigoAcesso, setCodigoAcesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  /**
   * Título: Valida e envia o cadastro
   * Explicação: Confere campos vazios, senha com pelo menos 8 caracteres e confirmação igual; então
   *   chama register() → POST /api/auth/register (AuthController.register). Com sucesso volta ao Login
   *   (popTo) com o e-mail preenchido.
   */
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={styles.container}>
        <View style={styles.topGlow} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.brand}><BrandLogo /><Text style={styles.subtitle}>Estoque e compras sob controle.</Text></View>
            <View style={styles.form}>
              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.description}>Informe seus dados e o código de acesso fornecido pela empresa.</Text>
              {/*
                Título: Campos do cadastro
                Explicação: Nome, e-mail, senha, confirmação e código de acesso; cada campo guarda o texto no seu
                  estado. O código de acesso é conferido pelo backend (variável CODIGO_CADASTRO).
              */}
              <TextField label="Nome" value={nome} onChangeText={setNome} editable={!loading} autoCapitalize="words" maxLength={120} returnKeyType="next" />
              <TextField label="E-mail" value={email} onChangeText={setEmail} editable={!loading} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={180} returnKeyType="next" />
              <TextField label="Senha" value={senha} onChangeText={setSenha} editable={!loading} secureTextEntry placeholder="Pelo menos 8 caracteres" returnKeyType="next" />
              <TextField label="Confirmar senha" value={confirmacao} onChangeText={setConfirmacao} editable={!loading} secureTextEntry returnKeyType="next" />
              <TextField label="Código de acesso" value={codigoAcesso} onChangeText={setCodigoAcesso} editable={!loading} secureTextEntry autoCapitalize="none" autoCorrect={false} onSubmitEditing={() => void handleRegister()} returnKeyType="go" />
              {/*
                Título: Mensagem de erro
                Explicação: Aparece quando a validação da tela ou o backend recusam o envio; o texto vem de
                  getApiErrorMessage().
              */}
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              {/*
                Título: Botão Criar conta
                Explicação: Chama handleRegister(), que confere se tudo foi preenchido, se a senha tem 8 caracteres
                  e se as senhas batem, e então chama register() → POST /api/auth/register (AuthController.register).
                  Com sucesso, volta ao Login com o e-mail preenchido.
              */}
              <Button title="Criar conta" loading={loading} onPress={() => void handleRegister()} />
              {/*
                Título: Botão Voltar para o login
                Explicação: Chama navigation.goBack() e volta à tela de Login sem enviar nada.
              */}
              <Button title="Voltar para o login" variant="secondary" disabled={loading} onPress={() => navigation.goBack()} />
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
  topGlow: { backgroundColor: colors.primaryLight, borderBottomLeftRadius: 140, borderBottomRightRadius: 140, height: 260, left: 0, opacity: 0.85, position: "absolute", right: 0, top: 0 },
  content: { alignSelf: "center", gap: spacing.xl, maxWidth: 520, padding: spacing.lg, width: "100%" },
  brand: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.sm, paddingVertical: spacing.lg },
  subtitle: { color: colors.textSecondary, fontSize: 14, paddingHorizontal: spacing.sm, textAlign: "center" },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, padding: spacing.lg, ...shadow.card },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  description: { color: colors.muted, marginTop: -spacing.xs },
  error: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, color: colors.danger, padding: spacing.sm, textAlign: "center" }
});
