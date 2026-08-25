import { Href, Link } from "expo-router";
import { Text, View, StyleSheet, Pressable } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen here.</Text>
      <Link href={"/app-stats" as Href} asChild>
        <Pressable>
          <Text>App Stats</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
