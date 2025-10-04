import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

const ChatbotScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: "https://new-interface-8edc25.zapier.app" }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        startInLoadingState={true}
        onLoadEnd={() => console.log("Zapier Interface Loaded")}
        onError={(e) => console.error("WebView Error:", e.nativeEvent)}
      />
    </View>
  );
};

export default ChatbotScreen;
