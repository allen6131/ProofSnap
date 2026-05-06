import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { apiRequest } from '../api/client';
import { StatusChip } from '../components/StatusChip';
import { useAuth } from '../store/auth';
import { ChatRecommendationRequest, ChatRecommendationResponse } from '../types';

const API_ERROR_PREFIX = 'Error: ';
const defaultQuestion = 'where is the best spot to go fishing/boating today';

function formatWindow(value?: string | null) {
  if (!value) return 'No window available';
  return new Date(value).toLocaleString();
}

export function ChatScreen() {
  const { token } = useAuth();
  const [message, setMessage] = useState(defaultQuestion);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<ChatRecommendationResponse | null>(null);

  const submit = async () => {
    if (!token || !message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<ChatRecommendationResponse>(
        '/chat/recommendations',
        {
          method: 'POST',
          body: JSON.stringify({ message: message.trim() } satisfies ChatRecommendationRequest),
        },
        token,
      );
      setResponse(data);
    } catch (err) {
      setError(String(err).replace(API_ERROR_PREFIX, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Ask rampready</Text>
      <Text style={{ color: '#4a5568', marginBottom: 12 }}>
        Ask for a source-backed boating or fishing access recommendation. rampready checks official
        weather, tide, buoy, alert, ramp, and supplemental water-quality sources before answering.
      </Text>

      <TextInput
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder="Where is the best spot to go fishing/boating today?"
        style={{
          borderWidth: 1,
          borderColor: '#cbd5e0',
          borderRadius: 10,
          padding: 12,
          minHeight: 82,
          textAlignVertical: 'top',
          marginBottom: 10,
          backgroundColor: '#fff',
        }}
      />
      <Pressable
        onPress={submit}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#718096' : '#2b6cb0',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
          {loading ? 'Checking official sources…' : 'Ask'}
        </Text>
      </Pressable>

      {loading ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
      {error ? <Text style={{ color: '#c53030', marginBottom: 12 }}>{error}</Text> : null}

      {response ? (
        <View>
          <View style={{ backgroundColor: '#ebf8ff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 4 }}>
              rampready assistant {response.used_openai ? '' : '(deterministic fallback)'}
            </Text>
            <Text style={{ color: '#2d3748' }}>{response.assistant_message}</Text>
          </View>

          {response.warnings.map((warning) => (
            <Text key={warning} style={{ color: '#975a16', marginBottom: 4 }}>
              ⚠ {warning}
            </Text>
          ))}

          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 }}>
            Ranked spots
          </Text>
          {response.recommendations.map((rec) => (
            <View
              key={rec.ramp_id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                padding: 12,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700' }}>
                    #{rec.rank} {rec.name}
                  </Text>
                  <Text style={{ color: '#4a5568' }}>
                    {rec.city || 'Unknown city'}, {rec.state || 'Unknown state'}
                  </Text>
                </View>
                <StatusChip color={rec.launch_color} />
              </View>
              <Text style={{ color: '#4a5568', marginTop: 6 }}>
                Best window: {formatWindow(rec.best_window?.starts_at)} →{' '}
                {formatWindow(rec.best_window?.ends_at)}
              </Text>
              <Text style={{ color: '#4a5568' }}>
                Fit: {rec.fit_score} • Confidence: {rec.confidence_score}
              </Text>
              {rec.top_reasons.slice(0, 3).map((reason) => (
                <Text key={`${rec.ramp_id}-${reason.code}`} style={{ color: '#2d3748', marginTop: 3 }}>
                  • {reason.message}
                </Text>
              ))}
              {[...rec.boating_notes, ...rec.fishing_notes].slice(0, 4).map((note) => (
                <Text key={`${rec.ramp_id}-${note}`} style={{ color: '#2b6cb0', marginTop: 3 }}>
                  • {note}
                </Text>
              ))}
              {rec.missing_data.map((item) => (
                <Text key={`${rec.ramp_id}-${item}`} style={{ color: '#975a16', marginTop: 3 }}>
                  Missing/verify: {item}
                </Text>
              ))}
              <Text style={{ color: '#718096', marginTop: 6 }}>
                Sources: {rec.source_cards.map((source) => source.provider).join(', ')}
              </Text>
            </View>
          ))}

          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 8 }}>
            Sources checked
          </Text>
          {response.sources.map((source) => (
            <View key={`${source.provider}-${source.name}`} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700' }}>{source.name}</Text>
              <Text style={{ color: '#4a5568' }}>
                {source.provider} • {source.status}
                {source.updated_at ? ` • updated ${formatWindow(source.updated_at)}` : ''}
              </Text>
              {source.notes.map((note) => (
                <Text key={note} style={{ color: '#718096' }}>• {note}</Text>
              ))}
            </View>
          ))}

          {response.suggested_followups.length ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: '700', marginBottom: 4 }}>Try asking next:</Text>
              {response.suggested_followups.map((followup) => (
                <Pressable key={followup} onPress={() => setMessage(followup)}>
                  <Text style={{ color: '#2b6cb0', marginBottom: 4 }}>• {followup}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={{ fontSize: 12, color: '#718096', marginTop: 14, marginBottom: 24 }}>
            {response.disclaimer}
          </Text>
        </View>
      ) : (
        <Text style={{ color: '#718096' }}>
          Example: “Which ramp looks safest this afternoon?” rampready will not request your device
          location automatically.
        </Text>
      )}
    </ScrollView>
  );
}
