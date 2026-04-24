'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useFormAction } from '@/src/hooks/use-form-action';
import {
  type AdditionalInfoFormData,
  additionalInfoFormSchema,
} from '@/src/lib/schemas/additional-info.schema';
import { saveAdditionalInfoAction } from '../_actions/save-additional-info.action';

const formatRUT = (value: string): string => {
  // Remove all non-alphanumeric characters
  const clean = value.replace(/[^0-9kK]/g, '');

  // Don't format if empty or just the verificador
  if (clean.length <= 1) return clean;

  // Split into rut body and verificador
  const body = clean.slice(0, -1);
  const verificador = clean.slice(-1);

  // Format the body with dots
  let formatted = '';
  const reversed = body.split('').reverse().join('');

  for (let i = 0; i < reversed.length; i++) {
    if (i > 0 && i % 3 === 0) {
      formatted = `.${formatted}`;
    }
    formatted = reversed[i] + formatted;
  }

  // Add dash and verificador
  return `${formatted}-${verificador}`;
};

const validateRUT = (rut: string): boolean => {
  if (!rut) return false;

  // Check format first
  const rutRegex = /^(\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1})$/;
  if (!rutRegex.test(rut)) return false;

  // Remove dots and dash
  const clean = rut.replace(/\./g, '').replace(/-/g, '');

  // Split body and verifier
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1).toLowerCase();

  // Calculate verifier digit
  let sum = 0;
  let multiplier = 2;

  // Reverse iteration through the body
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const calculatedVerifier = 11 - remainder;

  // Convert to verifier string
  let expectedVerifier: string;
  if (calculatedVerifier === 11) {
    expectedVerifier = '0';
  } else if (calculatedVerifier === 10) {
    expectedVerifier = 'k';
  } else {
    expectedVerifier = calculatedVerifier.toString();
  }

  return verifier === expectedVerifier;
};

export function AdditionalInfoForm() {
  const [rutTouched, setRutTouched] = useState(false);
  const [rutValid, setRutValid] = useState<boolean | null>(null);

  const { form, handleSubmit, serverState, isPending } =
    useFormAction<AdditionalInfoFormData>({
      schema: additionalInfoFormSchema,
      action: saveAdditionalInfoAction,
      defaultValues: {
        countryType: 'chile',
        nationalId: '',
        shoeSize: undefined,
        emergencyContactName: '',
        emergencyContactPhone: '',
      },
    });

  const countryType = form.watch('countryType');

  const handleRutChange = (value: string) => {
    setRutTouched(true);
    let formattedValue = value;

    if (countryType === 'chile') {
      formattedValue = formatRUT(value);
      setRutValid(validateRUT(formattedValue));
    }

    return formattedValue;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container relative mx-auto px-4 py-12 md:py-16">
        {/* Platanus logo in top right */}
        <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6 md:top-8 md:right-8">
          <div
            className="aspect-[576/112] h-7 w-auto sm:h-9 md:h-10"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              maskImage: 'url(/assets/logos/platanus.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
            }}
          />
        </div>

        {/* Main content */}
        <div className="mx-auto w-full max-w-2xl space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              Información{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Adicional
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Completa tu perfil con la información requerida
            </p>
          </div>

          {/* Form Card */}
          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Info Message */}
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                  <p className="font-mono text-sm text-yellow-800">
                    Por políticas del edificio, necesitamos tu RUT o NIN para
                    que puedas entrar a la hack.
                  </p>
                </div>

                {/* Country Type Selector */}
                <FormField
                  control={form.control}
                  name="countryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="chile">🇨🇱 Chile</SelectItem>
                          <SelectItem value="other">🌍 Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* National ID (RUT or NIN) */}
                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {countryType === 'chile'
                          ? 'RUT'
                          : 'National Identification Number'}
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder={
                              countryType === 'chile'
                                ? '12.345.678-9'
                                : 'Your national ID number'
                            }
                            disabled={isPending}
                            {...field}
                            onChange={(e) => {
                              const formatted = handleRutChange(e.target.value);
                              field.onChange(formatted);
                            }}
                            className={
                              countryType === 'chile' && rutTouched
                                ? rutValid
                                  ? 'border-green-500 pr-10'
                                  : 'border-red-500 pr-10'
                                : ''
                            }
                          />
                        </FormControl>
                        {countryType === 'chile' && rutTouched && (
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            {rutValid ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {countryType === 'chile' && (
                        <p className="text-muted-foreground text-sm">
                          Formato: 12.345.678-9
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Shoe Size */}
                <FormField
                  control={form.control}
                  name="shoeSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talla de Zapato (CL) 👀</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu talla" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="36">36</SelectItem>
                          <SelectItem value="37">37</SelectItem>
                          <SelectItem value="38">38</SelectItem>
                          <SelectItem value="39">39</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="41">41</SelectItem>
                          <SelectItem value="42">42</SelectItem>
                          <SelectItem value="43">43</SelectItem>
                          <SelectItem value="44">44</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-sm">
                        Talla chilena.{' '}
                        <a
                          href="https://www.nike.cl/size-guide/calzado-hombre"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:text-primary/80"
                        >
                          Ver tabla de transformación
                        </a>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Emergency Contact Name */}
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Contacto de Emergencia</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="María González"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Emergency Contact Phone */}
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono de Contacto de Emergencia</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+56 9 1234 5678"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Global Error */}
                {serverState.globalError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <p className="text-red-600 text-sm">
                      {serverState.globalError}
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {serverState.success && serverState.message && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4">
                    <p className="text-green-600 text-sm">
                      {serverState.message}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isPending || !form.formState.isValid}
                    className="w-full sm:w-auto"
                  >
                    {isPending ? 'Guardando...' : 'Continuar'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
