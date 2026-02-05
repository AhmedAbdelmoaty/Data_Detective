import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { DataTable } from "@/components/DataTable";
import { Database, TrendingUp, BarChart3, Lightbulb, Check, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DataDesk() {
  const { gameStatus, currentCase, discoverDataInsight, discoveredDataInsightIds, hasVisitedOffice } = useGameStore();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!hasVisitedOffice || gameStatus === "briefing") setLocation("/office");
  }, [gameStatus, hasVisitedOffice, setLocation]);

  // Level 1 case uses two simple charts:
  // 1) الاستفسارات مقابل المبيعات (leads vs sales)
  // 2) جودة الاستفسارات (category vs count)
  const salesData = currentCase.dataSets.find(d => d.name.includes("الاستفسارات"))?.rows || [];
  const qualityData = currentCase.dataSets.find(d => d.name.includes("جودة"))?.rows || [];

  const isInsightDiscovered = (id: string) => discoveredDataInsightIds.includes(id);

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          مركز البيانات
        </h1>
        <p className="text-muted-foreground mt-2">
          حلل الرسوم البيانية والجداول. عند اكتشاف نمط مهم، سجله كرؤية.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              تحليل الاستفسارات مقابل المبيعات
            </h3>
          </div>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#eab308" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="leads" name="الاستفسارات" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="sales" name="المبيعات (Sales)" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-xl"
        >
           <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              جودة الاستفسارات
            </h3>
          </div>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="count" name="العدد" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          الرؤى المتاحة
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          ادرس الرسوم البيانية أعلاه. عندما تلاحظ نمطاً مهماً، اضغط على "تسجيل" لحفظه كدليل.
        </p>
        
        <div className="space-y-3">
          {currentCase.dataSets.map((ds) => (
            ds.insights?.map((insight) => {
              const discovered = isInsightDiscovered(insight.id);
              return (
                <div
                  key={insight.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                    discovered 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : "bg-secondary/30 border-border/50 hover:border-amber-500/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {discovered ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-amber-500" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{ds.name}</div>
                      <div
                        className={cn(
                          "font-medium",
                          discovered ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {insight.title}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                        {insight.description}
                      </div>
                    </div>
                  </div>
                  
                  {!discovered && (
                    <button
                      onClick={() => discoverDataInsight(insight.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
                      data-testid={`button-discover-${insight.id}`}
                    >
                      <Lightbulb className="w-4 h-4" />
                      <span>تسجيل</span>
                    </button>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {currentCase.dataSets.map((ds) => (
          <DataTable 
            key={ds.name}
            title={ds.name} 
            data={ds.rows} 
            columns={Object.keys(ds.rows[0]).filter(k => k !== 'id')} 
          />
        ))}
      </div>
    </div>
  );
}
