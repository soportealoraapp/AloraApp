
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Users, Heart, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.96 1.62-3.33 0-6.03-2.7-6.03-6.03s2.7-6.03 6.03-6.03c1.87 0 3.13.77 3.9 1.5l2.73-2.73C18.74 1.94 15.96 1 12.48 1 7.02 1 3 5.02 3 9.5s4.02 8.5 9.48 8.5c2.9 0 5.2-1 6.84-2.62 1.73-1.68 2.34-4.27 2.34-6.42 0-.84-.08-1.48-.18-2.08h-9.8z" fill="currentColor"/>
  </svg>
);

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Apple</title>
    <path d="M12.15,2.5a5.17,5.17,0,0,0-4.3,2.44A5.22,5.22,0,0,0,5.31,9.78c0,3.13,2,6,5.13,6,1,0,2.18-.4,3.34-1.2a.5.5,0,0,1,.65.65c-1.31,1-2.8,1.6-4.29,1.6-3.8,0-6.7-3.06-6.7-7.22,0-2.3,1.15-4.43,3.2-5.59A5.4,5.4,0,0,1,12.15,2.5Zm.28-2.5C9.4,0,7,2.1,7,5.18,7,6.86,7.85,8.41,9.15,9.23a4.84,4.84,0,0,1,3.42.33,4.55,4.55,0,0,0,3.31,1.49c3.15,0,5.12-2.36,5.12-5.31,0-2.27-1.55-4.21-3.7-4.74A7.2,7.2,0,0,0,12.43,0Z" fill="currentColor"/>
  </svg>
);

type Step = "initial" | "onboarding" | "verification" | "complete";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("initial");
  const [gender, setGender] = useState<"woman" | "man" | "non-binary" | "">("");
  const router = useRouter();

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("onboarding");
  };
  
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("verification");
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/discover");
  };

  const progress = {
    initial: 25,
    onboarding: 50,
    verification: 75,
    complete: 100
  }[step];


  const renderStep = () => {
    switch (step) {
      case "initial":
        return (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label>Soy</Label>
              <RadioGroup
                required
                onValueChange={(value: "woman" | "man" | "non-binary") => setGender(value)}
                className="grid grid-cols-3 gap-2"
              >
                <Label htmlFor="woman" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full text-sm">
                  <RadioGroupItem value="woman" id="woman" className="sr-only" />
                  Mujer
                </Label>
                <Label htmlFor="man" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full text-sm">
                  <RadioGroupItem value="man" id="man" className="sr-only" />
                  Hombre
                </Label>
                 <Label htmlFor="non-binary" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full text-sm">
                  <RadioGroupItem value="non-binary" id="non-binary" className="sr-only" />
                  No binario
                </Label>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full font-bold" disabled={!gender}>
              Continuar
            </Button>
          </form>
        );
      case "onboarding":
        return (
           <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label>¿Cuáles son tus intereses? (Selecciona hasta 5)</Label>
               <div className="flex flex-wrap gap-2">
                 {['Viajar', 'Yoga', 'Arte', 'Música', 'Cocinar', 'Leer'].map(item => <Button type="button" key={item} variant="outline" size="sm">{item}</Button>)}
              </div>
            </div>
             <div className="space-y-2">
              <Label>¿Qué valores son importantes para ti?</Label>
               <div className="flex flex-wrap gap-2">
                 {['Honestidad', 'Amabilidad', 'Crecimiento', 'Lealtad', 'Humor'].map(item => <Button type="button" key={item} variant="outline" size="sm">{item}</Button>)}
              </div>
            </div>
            <Button type="submit" className="w-full font-bold">Siguiente Paso</Button>
          </form>
        );
      case "verification":
        return (
          <div className="text-center space-y-4">
              <div className="mx-auto bg-primary/20 rounded-full h-20 w-20 flex items-center justify-center">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <p>Para la seguridad de todos, requerimos una rápida verificación con selfie. Esto no aparecerá en tu perfil.</p>
              <Button onClick={handleVerificationSubmit} className="w-full font-bold">
                Abrir Cámara
              </Button>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'initial': return "Crea tu cuenta";
      case 'onboarding': return "Cuéntanos sobre ti";
      case 'verification': return "Un último paso";
      default: return "";
    }
  }

  const getDescription = () => {
    switch (step) {
      case 'initial': return "Únete a una comunidad construida en base a la confianza y seguridad.";
      case 'onboarding': return "Esto nos ayuda a encontrar tus mejores 'matches'.";
      case 'verification': return "Asegurémonos de que eres tú.";
      default: return "";
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
        <Progress value={progress} className="w-full mt-4" />
      </CardHeader>
      <CardContent>
        {renderStep()}
        {step === "initial" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O continuar con</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline"><GoogleIcon className="mr-2 h-4 w-4" /> Google</Button>
              <Button variant="outline"><AppleIcon className="mr-2 h-4 w-4" /> Apple</Button>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
