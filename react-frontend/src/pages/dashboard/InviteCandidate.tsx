/**
 * Invite candidate form: send magic-link invitations. Used by the Scheduler view.
 * Uses useInviteCandidate for jobs, send action, and success state.
 */

import { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { useInviteCandidate } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle, Copy } from 'lucide-react';
import { AlertMessage } from '@/components/ui/alert-message';
import type { Job } from '@/types';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export interface InviteCandidateProps {
  organizationId?: string;
}

const inviteSchema = z.object({
  candidateName: z.string().min(2, 'Name must be at least 2 characters'),
  candidateEmail: z.string().email('Please enter a valid email address'),
  selectedJobId: z.string().min(1, 'Please select a job role'),
  interviewDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const selectedDate = new Date(val);
    const now = new Date();
    // Allow up to 10 minutes in the past purely for UX friendliness on current times
    return selectedDate.getTime() > now.getTime() - 10 * 60 * 1000;
  }, { message: 'Interview date cannot be in the past' }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteCandidate({ organizationId }: InviteCandidateProps) {
  const { state } = useAuthContext();
  const userId = state.sub;

  const {
    jobs,
    isSending,
    error,
    magicLink,
    sendInvitation,
    clearMagicLink,
    clearError,
  } = useInviteCandidate({ userId, organizationId });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting }
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      candidateName: '',
      candidateEmail: '',
      selectedJobId: '',
      interviewDate: '',
    },
    mode: 'onTouched',
  });

  const [copied, setCopied] = useState(false);

  const onSubmit = async (data: InviteFormValues) => {
    clearError();
    const jobTitle = jobs.find((j) => j.id === data.selectedJobId)?.title ?? 'Unknown Role';
    const ok = await sendInvitation({
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      jobId: data.selectedJobId,
      jobTitle,
      interviewDate: data.interviewDate || undefined,
    });
    if (ok) {
      reset();
    }
  };

  const copyToClipboard = () => {
    if (!magicLink) return;
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center">
          <Mail className="h-6 w-6 mr-2 text-primary" aria-hidden />
          <CardTitle>Invite Candidate</CardTitle>
        </div>
        <CardDescription>Enter candidate details to schedule an interview.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {magicLink ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" aria-hidden />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Invitation Sent Successfully!</h3>
                  <p className="text-sm text-green-700 mb-3">
                    An email has been sent to the candidate. You can also share the link directly:
                  </p>
                  <div className="bg-white border border-green-300 rounded p-3 mb-3">
                    <p className="text-xs font-mono text-gray-600 break-all">{magicLink}</p>
                  </div>
                  <Button onClick={copyToClipboard} variant="outline" size="sm" className="w-full">
                    <Copy className="h-4 w-4 mr-2" aria-hidden />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={clearMagicLink} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Send Another Invitation
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AlertMessage type="error" message={error} />

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="candidateName">Candidate Name *</Label>
              <Input
                id="candidateName"
                placeholder="John Doe"
                {...register('candidateName')}
                className={errors.candidateName ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.candidateName && <span className="text-xs text-red-500 font-medium">{errors.candidateName.message}</span>}
            </div>
            
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="candidateEmail">Candidate Email *</Label>
              <Input
                id="candidateEmail"
                type="email"
                placeholder="candidate@example.com"
                {...register('candidateEmail')}
                className={errors.candidateEmail ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.candidateEmail && <span className="text-xs text-red-500 font-medium">{errors.candidateEmail.message}</span>}
            </div>
            
            <div className="space-y-2 flex flex-col">
               <Label htmlFor="jobSelect">Job Role *</Label>
               <Controller
                 name="selectedJobId"
                 control={control}
                 render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="jobSelect" className={errors.selectedJobId ? 'border-red-500 bg-red-50' : ''}>
                      <SelectValue placeholder="Select a job role" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job: Job) => (
                        <SelectItem key={job.id ?? 'default'} value={job.id ?? ''}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                 )}
               />
              {errors.selectedJobId ? (
                 <span className="text-xs text-red-500 font-medium">{errors.selectedJobId.message}</span>
              ) : (
                 <p className="text-xs text-gray-500">Create new jobs in the Jobs section.</p>
              )}
            </div>
            
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="interviewDate">Interview Date (Optional)</Label>
              <Input
                id="interviewDate"
                type="datetime-local"
                {...register('interviewDate')}
                className={errors.interviewDate ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.interviewDate && <span className="text-xs text-red-500 font-medium">{errors.interviewDate.message}</span>}
            </div>
            
            <Button
              type="submit"
              disabled={isSending || isSubmitting || !isValid}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12"
            >
              <Send className="h-4 w-4 mr-2" aria-hidden />
              {isSending ? 'Sending...' : 'Send Invitation'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              The candidate will receive an email with a secure magic link valid for 7 days.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
