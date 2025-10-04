import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VedAIResponse } from '../config/types';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  response?: VedAIResponse;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser, response }) => {
  if (isUser) {
    return (
      <View style={styles.rowRight}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowLeft}>
      <View style={styles.botBubble}>
        {response ? (
          <View>
            <Text style={styles.botTitle}>Ved AI Response:</Text>
            {response.dosage && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dosage:</Text>
                <Text style={styles.sectionContent}>{response.dosage}</Text>
              </View>
            )}
            {/* Repeat for other sections… */}
            <View style={styles.adviceSection}>
              <Text style={styles.adviceText}>{response.generalAdvice}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.botText}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: '#3498db',  // Your theme "primary-500"
    borderRadius: 16,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  userText: {
    color: '#fff',
  },
  botBubble: {
    backgroundColor: '#f3f4f6',  // Your theme "gray-100"
    borderRadius: 16,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  botTitle: {
    color: '#2d3748',
    fontWeight: '600',
    marginBottom: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 14,
    color: '#6b7280',
  },
  adviceSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
  },
  adviceText: {
    fontSize: 14,
    color: '#2563eb',
  },
  botText: {
    color: '#2d3748',
  },
});

export default ChatBubble;
