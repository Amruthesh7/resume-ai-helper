import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  ArrowLeft, 
  Loader2, 
  LogOut,
  Target,
  FileSearch,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from "lucide-react";

interface AnalysisResult {
  id: string;
  file_name: string;
  overall_score: number;
  keyword_score: number;
  format_score: number;
  language_score: number;
  missing_keywords: string[];
  keyword_suggestions: string[];
  format_issues: string[];
  format_suggestions: string[];
  language_issues: string[];
  action_verb_suggestions: string[];
  general_recommendations: string[];
  created_at: string;
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnalysis(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load analysis results.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const scoreCategories = [
    { label: "Keywords", score: analysis.keyword_score, icon: Target, color: "text-primary" },
    { label: "Formatting", score: analysis.format_score, icon: FileSearch, color: "text-secondary" },
    { label: "Language", score: analysis.language_score, icon: MessageSquare, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl gradient-text">ResumeAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{analysis.file_name}</h1>
              <p className="text-muted-foreground">
                Analyzed on {new Date(analysis.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <Link to="/upload">
              <Button className="gradient-primary hover:opacity-90">
                Analyze Another Resume
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Overall Score */}
          <Card className="glass-card lg:row-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Overall ATS Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <ScoreGauge score={analysis.overall_score} size="lg" />
            </CardContent>
          </Card>

          {/* Category Scores */}
          {scoreCategories.map((category, index) => (
            <Card key={category.label} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold">{category.score}</span>
                  <div className="flex-1">
                    <Progress value={category.score} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="keywords" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="formatting">Formatting</TabsTrigger>
              <TabsTrigger value="language">Language</TabsTrigger>
              <TabsTrigger value="recommendations">Tips</TabsTrigger>
            </TabsList>

            {/* Keywords Tab */}
            <TabsContent value="keywords" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Missing Keywords
                    </CardTitle>
                    <CardDescription>
                      Keywords that recruiters might be looking for
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.missing_keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.missing_keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="border-destructive/50 text-destructive">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No missing keywords detected!</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="w-5 h-5 text-accent" />
                      Suggested Keywords
                    </CardTitle>
                    <CardDescription>
                      Consider adding these industry-relevant keywords
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.keyword_suggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyword_suggestions.map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Great keyword coverage!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Formatting Tab */}
            <TabsContent value="formatting" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Format Issues
                    </CardTitle>
                    <CardDescription>
                      Issues that may affect ATS parsing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.format_issues.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.format_issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        No format issues detected!
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="w-5 h-5 text-accent" />
                      Format Suggestions
                    </CardTitle>
                    <CardDescription>
                      Tips to improve your resume structure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.format_suggestions.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.format_suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">Your formatting looks great!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Language Tab */}
            <TabsContent value="language" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Language Issues
                    </CardTitle>
                    <CardDescription>
                      Areas where the language could be improved
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.language_issues.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.language_issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        No language issues detected!
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="w-5 h-5 text-accent" />
                      Action Verb Suggestions
                    </CardTitle>
                    <CardDescription>
                      Stronger verbs to make your resume more impactful
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.action_verb_suggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.action_verb_suggestions.map((verb, index) => (
                          <Badge key={index} className="gradient-primary text-primary-foreground">
                            {verb}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Great use of action verbs!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    General Recommendations
                  </CardTitle>
                  <CardDescription>
                    Top tips to improve your resume's ATS compatibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.general_recommendations.length > 0 ? (
                    <ul className="space-y-4">
                      {analysis.general_recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0 text-sm font-bold text-primary-foreground">
                            {index + 1}
                          </div>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Your resume looks great! Keep up the good work.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
