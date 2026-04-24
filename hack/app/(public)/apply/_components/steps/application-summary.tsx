'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';
import { applicationSchema } from '@/src/lib/schemas/application.schema';
import { getCountryDisplay } from '@/src/lib/utils/countries';
import { useApplicationStore } from '@/src/store/application.store';
import { submitApplicationAction } from '../../_actions/submit-application.action';

// Global reference for submission handler
let globalSubmitHandler: (() => Promise<void>) | null = null;
let globalSuccessState = false;

export function ApplicationSummary() {
  const { formData, clearStorage } = useApplicationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate form data
      const validatedData = applicationSchema.parse(formData);

      // Submit to server
      const result = await submitApplicationAction(validatedData);

      if (result.success) {
        setSuccess(true);
        globalSuccessState = true;
        // Clear localStorage so refresh starts from beginning
        clearStorage();
      } else {
        setError(result.error || 'Failed to submit application');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register submit handler globally
  useEffect(() => {
    globalSubmitHandler = handleSubmit;
    return () => {
      globalSubmitHandler = null;
    };
  }, [formData]);

  if (success) {
    return (
      <div className="space-y-8">
        <h2 className="font-bold text-4xl">eso fue todo 🎉</h2>

        <div className="space-y-6 text-lg text-secondary-foreground">
          <p className="text-primary">¡postulación enviada!</p>

          <p>recibirán un mail de confirmación con más detalles 👀</p>

          <p>
            dudas? 👉 <span className="text-foreground">hack@platan.us</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-3xl">resumen</h2>
        <Badge variant="outline" className="text-base">
          {formData.modality === 'team'
            ? formData.teamStatus === 'looking'
              ? '👥 Buscando equipo'
              : `👥 Equipo ${formData.teamSize ? `(${formData.teamSize})` : ''}`
            : '👤 Solo'}
        </Badge>
      </div>

      {/* Team/Participants Section */}
      <div className="space-y-4">
        <h3 className="font-semibold">
          {formData.modality === 'team'
            ? 'Integrantes del equipo'
            : 'Participante'}
        </h3>
        {formData.members.map((member) => (
          <Card key={`${member.fullName}-${member.email}`}>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-secondary-foreground text-sm">Nombre</p>
                  <p className="font-semibold">{member.fullName}</p>
                </div>
                <div>
                  <p className="text-secondary-foreground text-sm">País</p>
                  <p className="font-semibold">
                    {getCountryDisplay(member.country)}
                  </p>
                </div>
                <div>
                  <p className="text-secondary-foreground text-sm">Email</p>
                  <p className="font-mono text-sm">{member.email}</p>
                </div>
                <div>
                  <p className="text-secondary-foreground text-sm">GitHub</p>
                  <a
                    href={member.githubProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {member.githubProfile}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes */}
      <div className="rounded border border-border bg-card/50 p-4 text-secondary-foreground text-sm">
        <p>
          revisa que todo esté correcto antes de enviar! después no podrás
          cambiar los datos.
        </p>
      </div>

      {error && (
        <div className="rounded border border-destructive bg-destructive p-4 text-destructive-foreground">
          <p className="font-semibold">Error submitting application:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isSubmitting && (
        <div className="text-center">
          <p className="text-secondary-foreground">
            Submitting your application...
          </p>
        </div>
      )}
    </div>
  );
}

// Export global submit handler for use in navigation button
export function getSubmitHandler() {
  return globalSubmitHandler;
}

// Export success state for hiding navigation buttons
export function isSubmissionSuccessful() {
  return globalSuccessState;
}
