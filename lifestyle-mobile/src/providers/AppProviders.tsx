import { ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ConnectivityProvider } from './ConnectivityProvider';
import { AuthProvider } from './AuthProvider';
import { SubjectProvider } from './SubjectProvider';
import { SyncProvider } from './SyncProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClientRef = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
        },
      },
    })
  );
  const persister = useRef(createAsyncStoragePersister({ storage: AsyncStorage }));

  return (
    <PersistQueryClientProvider
      client={queryClientRef.current}
      persistOptions={{ persister: persister.current }}
    >
      <ConnectivityProvider>
        <AuthProvider>
          <SubjectProvider>
            <SyncProvider>{children}</SyncProvider>
          </SubjectProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </PersistQueryClientProvider>
  );
}
