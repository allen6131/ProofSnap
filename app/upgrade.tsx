import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ENTITLEMENT_PRODUCTS } from '@/entitlement/products';
import { localPurchaseProvider } from '@/entitlement/localEntitlementProvider';

export default function UpgradeScreen() {
  const proAnnual = ENTITLEMENT_PRODUCTS.find((product) => product.id === 'pro_annual');
  const lifetime = ENTITLEMENT_PRODUCTS.find((product) => product.id === 'lifetime');

  return (
    <Screen>
      <Text style={styles.eyebrow}>ProofSnap Pro</Text>
      <Text style={styles.title}>Unlimited reports, no watermark, better branding.</Text>
      <Text style={styles.body}>
        Free users can create 3 reports per month with a ProofSnap watermark. Pro is designed
        for contractors, cleaners, hosts, and property teams who need client-ready PDFs every week.
      </Text>

      <Card>
        <Text style={styles.planTitle}>{proAnnual?.name}</Text>
        <Text style={styles.price}>{proAnnual?.priceLabel}</Text>
        {proAnnual?.features.map((feature) => (
          <Text key={feature} style={styles.feature}>
            • {feature}
          </Text>
        ))}
      </Card>

      <Card>
        <Text style={styles.planTitle}>{lifetime?.name}</Text>
        <Text style={styles.price}>{lifetime?.priceLabel}</Text>
        {lifetime?.features.map((feature) => (
          <Text key={feature} style={styles.feature}>
            • {feature}
          </Text>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Simulate Pro for QA"
          onPress={() => {
            localPurchaseProvider.startAnnualPurchase().catch(console.error);
          }}
        />
        <Button
          label="Simulate lifetime unlock"
          variant="secondary"
          onPress={() => {
            localPurchaseProvider.startLifetimePurchase().catch(console.error);
          }}
        />
        <Button
          label="Restore purchases (stub)"
          variant="secondary"
          onPress={() => {
            localPurchaseProvider.restorePurchases().catch(console.error);
          }}
        />
      </View>

      <Text style={styles.note}>
        Real App Store and Google Play purchases will plug into this provider later. No account
        or cloud upload is required for the MVP.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 8,
  },
  body: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  feature: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 24,
  },
  note: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
  },
  planTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  price: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    marginBottom: 10,
  },
});
