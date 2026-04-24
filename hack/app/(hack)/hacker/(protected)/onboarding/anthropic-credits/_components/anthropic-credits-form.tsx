'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
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
import {
  type AnthropicCreditsFormData,
  anthropicCreditsFormSchema,
} from '@/src/lib/schemas/anthropic-credits.schema';
import { saveAnthropicCreditsAction } from '../_actions/save-anthropic-credits.action';

const ANTHROPIC_PRODUCTS = [
  'Claude.ai',
  'Claude code',
  'Claude API',
  'Ninguno de los anteriores',
];

export function AnthropicCreditsForm() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { form, handleSubmit, serverState, isPending } =
    useFormAction<AnthropicCreditsFormData>({
      schema: anthropicCreditsFormSchema,
      action: saveAnthropicCreditsAction,
      defaultValues: {
        anthropicAccountEmail: '',
        anthropicOrgId: '',
        anthropicUsedProducts: [],
        anthropicUpdates: true,
      },
    });

  const toggleProduct = (product: string) => {
    const updated = selectedProducts.includes(product)
      ? selectedProducts.filter((p) => p !== product)
      : [...selectedProducts, product];
    setSelectedProducts(updated);
    form.setValue('anthropicUsedProducts', updated, {
      shouldValidate: true,
    });
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
              Créditos{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Anthropic
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Recibe $50 USD en créditos de API de Anthropic
            </p>
          </div>

          {/* Tutorial Section */}
          <div className="border-2 border-blue-500 bg-blue-50/80 p-6 backdrop-blur-sm sm:p-8">
            <div className="space-y-4">
              <p className="font-mono text-blue-800 text-sm">
                <a
                  href="https://console.anthropic.com/settings/organization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-blue-600"
                >
                  Visita console.anthropic.com/settings/organization
                </a>{' '}
                y copia los valores marcados:
              </p>
              {/* Screenshot */}
              <div className="overflow-hidden rounded-md border-2 border-blue-300">
                <a
                  href="/assets/images/misc/anthropic-tutorial.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer transition-opacity hover:opacity-90"
                >
                  <Image
                    src="/assets/images/misc/anthropic-tutorial.png"
                    alt="Captura de pantalla mostrando cómo encontrar el Organization ID en Anthropic Console"
                    width={800}
                    height={0}
                    className="h-auto w-full"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Email */}
                <FormField
                  control={form.control}
                  name="anthropicAccountEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email para tu cuenta de Anthropic *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-muted-foreground text-sm">
                        Enviaremos los créditos a este email
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Organization ID */}
                <FormField
                  control={form.control}
                  name="anthropicOrgId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-muted-foreground text-sm">
                        Ingresa tu Organization ID en formato UUID
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Used Products */}
                <FormField
                  control={form.control}
                  name="anthropicUsedProducts"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        ¿Qué productos de Anthropic has usado? *
                      </FormLabel>
                      <div className="space-y-2">
                        {ANTHROPIC_PRODUCTS.map((product) => (
                          <div
                            key={product}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={product}
                              checked={selectedProducts.includes(product)}
                              onCheckedChange={() => toggleProduct(product)}
                              disabled={isPending}
                            />
                            <label
                              htmlFor={product}
                              className="font-mono text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {product}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Marketing Updates */}
                <FormField
                  control={form.control}
                  name="anthropicUpdates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-mono text-sm">
                          Quiero recibir actualizaciones de productos y recursos
                          de Anthropic
                        </FormLabel>
                      </div>
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
