import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, X, Check } from "lucide-react";
import { useAuthContext } from "@asgardeo/auth-react";
import { API } from "@/lib/api";
import { cn } from "@/lib/utils";

const SKILL_CATEGORIES = {
    "Languages": [
        "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "Swift", "Kotlin", "Bsh"
    ],
    "Web & Frameworks": [
        "React", "Angular", "Vue.js", "Node.js", "Spring Boot", "Django", "Flask", "FastAPI",
        "React Native", "Flutter", "GraphQL", "REST API", "Microservices"
    ],
    "Data & AI": [
        "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Pandas",
        "NumPy", "Scikit-learn", "Hadoop", "Spark", "Kafka", "PowerBI", "Tableau"
    ],
    "Infrastructure & Cloud": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins",
        "Git", "CI/CD", "Linux", "Redis"
    ],
    "Databases": [
        "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Oracle"
    ],
    "Tools & Agile": [
        "Figma", "Adobe XD", "JIRA", "Agile", "Scrum"
    ]
};

interface CreateJobProps {
    organizationId?: string;
    onJobCreated?: () => void;
}

export default function CreateJob({ organizationId, onJobCreated }: CreateJobProps) {
    const { state } = useAuthContext();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [currentSkill, setCurrentSkill] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>("Languages");

    const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault();
            toggleSkill(currentSkill.trim());
            setCurrentSkill('');
        }
    };

    const toggleSkill = (skill: string) => {
        if (skills.includes(skill)) {
            setSkills(skills.filter(s => s !== skill));
        } else {
            setSkills([...skills, skill]);
        }
    };

    // const handleCreateJob = async () => {
    //     setError('');
    //     setSuccess('');

    //     if (!title || !description || skills.length === 0) {
    //         setError('Please fill in required fields and add at least one skill.');
    //         return;
    //     }

    //     if (!organizationId || !state.sub) {
    //         setError('Organization or recruiter information missing.');
    //         return;
    //     }

    //     setIsLoading(true);

    //     try {
    //         const payload = {
    //             title,
    //             description,
    //             requiredSkills: skills,
    //             screeningQuestions: screeningQuestions,
    //             organizationId,
    //             recruiterId: state.sub
    //         };

    //         await API.createJob(payload);
    //         setSuccess('Job created successfully!');
    //         setTitle('');
    //         setDescription('');
    //         setSkills([]);
    //         setScreeningQuestions([]);
    //         if (onJobCreated) onJobCreated();
    //     } catch (err) {
    //         console.error(err);
    //         setError('Failed to create job.');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleCreateJob = async () => {
        setError('');
        setSuccess('');

        // Basic Validation
        if (!title || !description || skills.length === 0) {
            setError('Please fill in required fields and add at least one skill.');
            return;
        }

        if (!organizationId || !state.sub) {
            setError('Organization or recruiter information missing.');
            return;
        }

        setIsLoading(true);

        try {
            // STEP 1: Create the Job Role (No questions in this payload)
            const jobPayload = {
                title,
                description,
                requiredSkills: skills,
                organizationId,
                recruiterId: state.sub
                // screeningQuestions is removed from here!
            };

            await API.createJob(jobPayload);

            setSuccess('Job role created successfully! You can now add interview questions in the Questions tab.');

            // Reset Form
            setTitle('');
            setDescription('');
            setSkills([]);

            if (onJobCreated) onJobCreated();

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create job.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Card className="shadow-lg mb-8 border-t-4 border-t-[#FF7300]">
            <CardHeader>
                <div className="flex items-center">
                    <Briefcase className="h-6 w-6 mr-2 text-[#FF7300]" />
                    <CardTitle>Create New Job Role</CardTitle>
                </div>
                <CardDescription>Define the role and required skills to start filtering candidates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Senior Frontend Engineer"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Short Description</Label>
                        <Input
                            id="description"
                            placeholder="Brief description of the role..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label>Required Skills</Label>
                        <span className="text-xs text-gray-500">{skills.length} selected</span>
                    </div>

                    {/* Selected Skills */}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[50px]">
                            {skills.map(skill => (
                                <span key={skill} className="bg-[#FF7300]/10 text-[#FF7300] border border-[#FF7300]/20 text-xs px-2 py-1 rounded-full flex items-center shadow-sm animate-in fade-in zoom-in duration-200">
                                    {skill}
                                    <button onClick={() => toggleSkill(skill)} className="ml-1 text-[#FF7300] hover:text-[#d36000]">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Skill Selector */}
                    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="flex overflow-x-auto border-b bg-gray-50 scrollbar-hide">
                            {Object.keys(SKILL_CATEGORIES).map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={cn(
                                        "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 hover:bg-gray-100",
                                        activeCategory === category
                                            ? "border-[#FF7300] text-[#FF7300] bg-white"
                                            : "border-transparent text-gray-600"
                                    )}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 bg-white min-h-[200px]">
                            <div className="flex flex-wrap gap-2">
                                {SKILL_CATEGORIES[activeCategory as keyof typeof SKILL_CATEGORIES].map((skill) => {
                                    const isSelected = skills.includes(skill);
                                    return (
                                        <button
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            className={cn(
                                                "text-xs px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center",
                                                isSelected
                                                    ? "bg-[#FF7300] text-white border-[#FF7300] shadow-md transform scale-105"
                                                    : "bg-white text-gray-700 border-gray-200 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-sm"
                                            )}
                                        >
                                            {isSelected && <Check className="w-3 h-3 mr-1" />}
                                            {skill}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 border-t flex items-center gap-2">
                            <Plus className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Add a custom skill..."
                                value={currentSkill}
                                onChange={(e) => setCurrentSkill(e.target.value)}
                                onKeyDown={handleAddCustomSkill}
                                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm"
                            />
                        </div>
                    </div>
                </div>



                <Button
                    onClick={handleCreateJob}
                    disabled={isLoading}
                    className="w-full bg-gray-900 hover:bg-gray-800 h-11 text-base shadow-md transition-all active:scale-[0.99]"
                >
                    {isLoading ? 'Creating Job...' : 'Create Job Role'} <Plus className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
