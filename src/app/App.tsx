import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import type { StorageAdapter } from '../storage/storage';
import { Layout } from '../components/Layout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Onboarding } from '../pages/Onboarding';
import { Today } from '../pages/Today';
import { Practise } from '../pages/Practise';
import { ScenarioPlayer } from '../pages/ScenarioPlayer';
import { JournalEditor, JournalList, JournalView } from '../pages/Journal';
import { Library, LibraryDetail } from '../pages/Library';
import { Progress } from '../pages/Progress';
import { About, Framework, More, Privacy, References } from '../pages/Pages';
import { Settings } from '../pages/Settings';
import { NotFound } from '../pages/NotFound';

function Gate() {
  const { data } = useStore();
  const loc = useLocation();
  const onboarded = !!data.onboardingCompletedAt;
  // Information pages stay reachable before onboarding (e.g. Privacy linked from outside).
  const openPaths = ['/about', '/privacy', '/references', '/framework'];
  if (!onboarded && loc.pathname !== '/welcome' && !openPaths.includes(loc.pathname)) return <Navigate to="/welcome" replace />;
  return (
    <Routes>
      <Route path="/welcome" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="practise" element={<Practise />} />
        <Route path="practise/:id" element={<ScenarioPlayer />} />
        <Route path="journal" element={<JournalList />} />
        <Route path="journal/new" element={<JournalEditor key="new" />} />
        <Route path="journal/:id" element={<JournalView />} />
        <Route path="journal/:id/edit" element={<JournalEditor />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<LibraryDetail />} />
        <Route path="progress" element={<Progress />} />
        <Route path="more" element={<More />} />
        <Route path="about" element={<About />} />
        <Route path="framework" element={<Framework />} />
        <Route path="references" element={<References />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export function App({ adapter }: { adapter?: StorageAdapter }) {
  return (
    <ErrorBoundary>
      <StoreProvider adapter={adapter}>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Gate />
        </HashRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
}
