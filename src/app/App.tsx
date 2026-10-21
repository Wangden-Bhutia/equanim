import { useEffect } from 'react';
import { startInstallListener } from '../engine/install';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import type { StorageAdapter } from '../storage/storage';
import { Layout } from '../components/Layout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Welcome } from '../pages/programme/Welcome';
import { Values } from '../pages/programme/Values';
import { Baseline } from '../pages/programme/Baseline';
import { Session } from '../pages/programme/Session';
import { Review } from '../pages/programme/Review';
import { Plan } from '../pages/programme/Plan';
import { Finish, ProgrammeOverview, ProgrammeWeek } from '../pages/programme/Overview';
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
  const openPaths = ['/about', '/privacy', '/references', '/framework', '/session/taster'];
  if (!onboarded && loc.pathname !== '/welcome' && !openPaths.includes(loc.pathname)) return <Navigate to="/welcome" replace />;
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
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
        <Route path="programme" element={<ProgrammeOverview />} />
        <Route path="programme/week/:n" element={<ProgrammeWeek />} />
        <Route path="session/:id" element={<Session />} />
        <Route path="values" element={<Values />} />
        <Route path="baseline" element={<Baseline />} />
        <Route path="review/:week" element={<Review />} />
        <Route path="plan" element={<Plan />} />
        <Route path="finish" element={<Finish />} />
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
  useEffect(() => { startInstallListener(); }, []);
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
