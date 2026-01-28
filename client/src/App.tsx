import { Switch, Route, Redirect } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useGameStore } from "@/store/gameStore";

import Intro from "@/pages/Intro";
import Office from "@/pages/Office";
import HypothesisBoard from "@/pages/HypothesisBoard";
import EvidenceRoom from "@/pages/EvidenceRoom";
import DataDesk from "@/pages/DataDesk";
import Interviews from "@/pages/Interviews";
import Report from "@/pages/Report";

export default function App() {
  const { gameStatus, getRemainingHypotheses } = useGameStore();

  const remaining = getRemainingHypotheses();
  const canOpenReport = remaining.length === 1;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar يظهر فقط بعد بدء اللعب */}
      {gameStatus !== "briefing" && <Sidebar />}

      <main className="flex-1 overflow-y-auto">
        <Switch>
          {/* البداية */}
          <Route path="/">
            <Redirect to="/intro" />
          </Route>

          <Route path="/intro" component={Intro} />
          <Route path="/office" component={Office} />

          {/* لوحة الفرضيات */}
          <Route path="/hypotheses">
            {gameStatus === "briefing" ? <Redirect to="/office" /> : <HypothesisBoard />}
          </Route>

          {/* الغرف */}
          <Route path="/evidence">
            {gameStatus === "briefing" ? <Redirect to="/office" /> : <EvidenceRoom />}
          </Route>

          <Route path="/data">
            {gameStatus === "briefing" ? <Redirect to="/office" /> : <DataDesk />}
          </Route>

          <Route path="/interviews">
            {gameStatus === "briefing" ? <Redirect to="/office" /> : <Interviews />}
          </Route>

          {/* التقرير */}
          <Route path="/report">
            {!canOpenReport ? <Redirect to="/hypotheses" /> : <Report />}
          </Route>

          {/* أي مسار غلط */}
          <Route>
            <Redirect to="/intro" />
          </Route>
        </Switch>
      </main>
    </div>
  );
}
