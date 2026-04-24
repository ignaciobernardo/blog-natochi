'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { useFormAction } from '@/src/hooks/use-form-action';
import type { HackerProfile } from '@/src/lib/db/schema';
import {
  type RunwayEmailFormData,
  runwayEmailFormSchema,
} from '@/src/lib/schemas/runway-email.schema';
import { submitRunwayEmailAction } from '../_actions/submit-runway-email.action';
import { RunwayDeadlineCountdown } from './runway-deadline-countdown';

interface RunwayWebSectionProps {
  hackerProfile: HackerProfile | null | undefined;
}

export function RunwayWebSection({ hackerProfile }: RunwayWebSectionProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const hasSubmittedEmail = hackerProfile?.runwayEmail;

  const { form, handleSubmit, serverState, isPending } =
    useFormAction<RunwayEmailFormData>({
      schema: runwayEmailFormSchema,
      action: submitRunwayEmailAction,
      defaultValues: {
        runwayEmail: hackerProfile?.runwayEmail || '',
      },
    });

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = form.getValues('runwayEmail');
    setPendingEmail(email);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    handleSubmit();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold font-title text-primary text-xl uppercase">
          Instrucciones
        </h3>
        <p className="font-mono text-primary/70 text-sm">
          Crea tu cuenta en las siguientes plataformas con el{' '}
          <span className="font-bold text-primary">mismo email</span>
        </p>
      </div>

      <div className="border-2 border-primary/20 bg-primary/5 p-4">
        <p className="font-bold font-title text-primary text-sm">
          ⚠️ IMPORTANTE
        </p>
        <p className="mt-1 font-mono text-primary/70 text-sm">
          Debes usar el mismo email en ambas plataformas para recibir los
          créditos
        </p>
      </div>

      <RunwayDeadlineCountdown />

      <div className="space-y-3">
        <a
          href="https://app.runwayml.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between border-2 border-primary/20 bg-background p-4 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div>
            <p className="font-bold font-title text-primary">Runway App</p>
            <p className="font-mono text-primary/70 text-sm">
              app.runwayml.com
            </p>
          </div>
          <ExternalLink className="h-5 w-5 text-primary" />
        </a>

        <a
          href="https://dev.runwayml.com/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between border-2 border-primary/20 bg-background p-4 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div>
            <p className="font-bold font-title text-primary">
              Runway Dev Portal
            </p>
            <p className="font-mono text-primary/70 text-sm">
              dev.runwayml.com
            </p>
          </div>
          <ExternalLink className="h-5 w-5 text-primary" />
        </a>
      </div>

      {hasSubmittedEmail ? (
        <div className="flex items-center gap-3 border-2 border-primary bg-primary/5 p-4">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <div>
            <p className="font-bold font-title text-primary">Email enviado</p>
            <p className="font-mono text-primary/70 text-sm">
              {hackerProfile.runwayRequestSentAt
                ? `Enviado el ${new Date(hackerProfile.runwayRequestSentAt).toLocaleDateString('es-ES')}`
                : 'Tu información ha sido registrada'}
            </p>
            <p className="mt-1 font-mono text-primary text-sm">
              {hackerProfile.runwayEmail}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 border-2 border-primary/20 bg-background p-4">
          <p className="font-mono text-primary text-sm">
            Una vez tu cuenta en ambas plataformas esté lista, publica tu email
            acá:
          </p>

          <Form {...form}>
            <form onSubmit={onFormSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="runwayEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold font-title text-primary text-sm uppercase">
                      Email de Runway
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        disabled={isPending}
                        className="border-2 border-primary/20 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverState.globalError && (
                <div className="border-2 border-primary/20 bg-background p-4">
                  <p className="font-mono text-primary text-sm">
                    {serverState.globalError}
                  </p>
                </div>
              )}

              {serverState.success && serverState.message && (
                <div className="border-2 border-primary bg-primary/5 p-4">
                  <p className="font-mono text-primary text-sm">
                    {serverState.message}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending || !form.formState.isValid}
                className="border-2 border-primary bg-primary font-bold font-title text-background hover:bg-background hover:text-primary"
              >
                {isPending ? 'Enviando...' : 'Enviar Email'}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas enviar el email{' '}
              <span className="font-semibold">{pendingEmail}</span> para
              solicitar créditos de Runway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
