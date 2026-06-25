import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import { AlertTriangle, Bot, Calculator, FileText, MessageSquare, Send, Shield, Sparkles, TrendingUp, Zap } from 'lucide-react';

const aiFeatures = [
    {
        title: 'Smart Quote Generator',
        description: 'Generate insurance quotes using natural language',
        icon: Calculator,
        example: 'Create auto quote for 30-year-old male, Lagos, Toyota Corolla 2018',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
    },
    {
        title: 'Underwriting Assistant',
        description: 'Get AI-powered risk assessment and coverage suggestions',
        icon: Shield,
        example: 'Analyze risk for property insurance in flood-prone area',
        color: 'text-success',
        bgColor: 'bg-success/10',
    },
    {
        title: 'Fraud Detection',
        description: 'Identify suspicious patterns and potential fraud',
        icon: AlertTriangle,
        example: 'Check this claim for fraud indicators',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
    },
    {
        title: 'Policy Summarizer',
        description: 'Convert complex policies into plain English',
        icon: FileText,
        example: 'Summarize this life insurance policy for customer',
        color: 'text-accent',
        bgColor: 'bg-accent/10',
    },
];

const chatHistory = [
    {
        id: 1,
        type: 'user',
        message: 'Create an auto insurance quote for a 32-year-old female in Lagos with a 2020 Honda Accord',
        timestamp: '2 minutes ago',
    },
    {
        id: 2,
        type: 'ai',
        message:
            "I'll help you create an auto insurance quote. Based on the information provided:\n\n**Customer Profile:**\n- Age: 32 years old\n- Gender: Female\n- Location: Lagos, Nigeria\n- Vehicle: 2020 Honda Accord\n\n**Recommended Coverage:**\n- Third Party: ₦15,000 (Mandatory)\n- Comprehensive: ₦285,000 (Recommended)\n- Premium estimate: ₦42,750/year\n\nWould you like me to generate the full quote document?",
        timestamp: '1 minute ago',
    },
];

const AIAssistant = () => {
    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    {/* Coming Soon Section */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Coming Soon...</h1>
                        <p className="text-muted-foreground">This feature is currently under development.</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
                            <Badge className="bg-primary">
                                <Sparkles className="mr-1 h-3 w-3" />
                                Beta
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">Your intelligent insurance management companion</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* AI Features */}
                    <div className="space-y-4 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    AI Capabilities
                                </CardTitle>
                                <CardDescription>Explore what our AI can help you with</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {aiFeatures.map((feature, index) => (
                                    <div key={index} className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50">
                                        <div className="flex items-start gap-3">
                                            <div className={`h-8 w-8 rounded-lg ${feature.bgColor} flex items-center justify-center`}>
                                                <feature.icon className={`h-4 w-4 ${feature.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium">{feature.title}</h4>
                                                <p className="mb-2 text-xs text-muted-foreground">{feature.description}</p>
                                                <div className="rounded bg-muted p-2 text-xs italic">"{feature.example}"</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <FileText className="h-4 w-4" />
                                    Generate Quote
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Shield className="h-4 w-4" />
                                    Risk Assessment
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Market Analysis
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-2">
                        <Card className="flex h-[600px] flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    AI Chat
                                </CardTitle>
                                <CardDescription>Ask questions or request assistance with insurance tasks</CardDescription>
                            </CardHeader>

                            {/* Chat Messages */}
                            <CardContent className="flex-1 space-y-4 overflow-y-auto">
                                {chatHistory.map((message) => (
                                    <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {message.type === 'ai' && (
                                            <Avatar className="h-8 w-8 bg-primary">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${
                                                message.type === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
                                            }`}
                                        >
                                            <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                                            <div className={`mt-1 text-xs opacity-70`}>{message.timestamp}</div>
                                        </div>

                                        {message.type === 'user' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-accent text-accent-foreground">JD</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                            </CardContent>

                            {/* Input Area */}
                            <div className="border-t p-4">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Ask AI anything about insurance, quotes, policies, or get help with tasks..."
                                        className="min-h-[80px] flex-1 resize-none"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <Button size="icon" className="h-10 w-10">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">AI responses are generated and may require verification</p>
                                    <Badge variant="outline" className="text-xs">
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        Powered by GPT-4
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AIAssistant;
