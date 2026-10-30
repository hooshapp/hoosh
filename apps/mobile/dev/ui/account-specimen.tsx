import { View } from 'react-native';

import { AccountHeader } from '@/features/account/account-header';

/** Isolated presentation fixtures; this entry has no Auth provider or API requests. */
export function AccountSpecimen({ width }: { width: number }) {
  return (
    <section data-testid="RN05_ACCOUNT_SPECIMEN_ONLY">
      <h2>Account region — synthetic presentation only</h2>
      <p>
        Original Settings avatar; neutral title until a real profile exists. No account is
        connected.
      </p>
      {[
        { label: 'email', email: 'fixture@example.test' },
        { label: 'null-email', email: null },
        { label: 'long-email', email: `${'long-address-'.repeat(8)}ü@example.test` },
      ].map(({ label, email }) => (
        <div
          key={label}
          data-account-case={label}
          style={{ width, background: '#FFF1DD', marginBottom: 16 }}>
          <View>
            <AccountHeader identity={{ user_id: 'a46e48ad-c742-4e18-b57d-2c9a56544944', email }} />
          </View>
        </div>
      ))}
    </section>
  );
}
