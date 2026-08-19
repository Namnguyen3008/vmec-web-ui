import type { ReactNode } from "react";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "@/theme/colors";

interface TextFieldProps {
  label?: string;
  icon: ReactNode;
  rightElement?: ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  textContentType?: TextInputProps["textContentType"];
}

export function TextField({
  label,
  icon,
  rightElement,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  textContentType,
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        {icon}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textContentType={textContentType}
        />
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 4,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textLabel,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 13,
    gap: 12,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textLabel,
    height: "100%",
  },
});
