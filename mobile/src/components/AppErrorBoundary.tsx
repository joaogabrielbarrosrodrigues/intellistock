import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";
import { Button } from "./ui";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error("Falha não tratada na interface", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>Não foi possível exibir esta tela</Text>
        <Text style={styles.message}>Tente novamente. Se o problema continuar, reinicie o aplicativo.</Text>
        {__DEV__ ? <Text style={styles.details}>{this.state.error.message}</Text> : null}
        <Button onPress={() => this.setState({ error: null })} title="Tentar novamente" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, gap: spacing.md, justifyContent: "center", padding: spacing.xl },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", textAlign: "center" },
  message: { color: colors.textSecondary, lineHeight: 21, textAlign: "center" },
  details: { color: colors.danger, fontSize: 12, textAlign: "center" }
});
