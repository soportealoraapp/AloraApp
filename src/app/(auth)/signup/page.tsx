"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { authService } from "@/lib/firebase/auth-service";
import { profileService } from "@/lib/firebase/profile-service";
import { preferencesService } from "@/lib/firebase/preferences-service";
import { referralService } from "@/lib/firebase/referral-service";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "initial" | "onboarding" | "verification" | "complete";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("initial");
  const [gender, setGender] = useState<"woman" | "man" | "non-binary" | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender) {
      setError("Por favor selecciona tu género");
      return;
    }
    setStep("onboarding");
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create user account
      const user = await authService.signUp(email, password, displayName);

      // Create profile in Firestore
      await profileService.createProfile(user.uid, {
        email,
        displayName,
        age: parseInt(age),
        gender: gender as any,
        city,
        photos: [],
        interests: selectedInterests,
        values: selectedValues,
        musicGenres: [],
        status: "Conociendo gente nueva",
        bio: "",
        isVerified: false,
        verificationStatus: "none",
        seeking: "all",
        uid: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date(),
        isPremium: false,
        isActive: true,
      });

      // Create default preferences
      await preferencesService.createPreferences(user.uid);

      // Create referral code
      await referralService.createReferralCode(user.uid);

      toast({
        title: "¡Cuenta creada!",
        description: "Por favor verifica tu email para continuar.",
      });

      setStep("verification");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Verificación pendiente",
      description: "La funcionalidad de verificación por selfie se implementará próximamente. Por ahora puedes explorar la app.",
    });
    router.push("/discover");
  };

  const progress = {
    initial: 25,
    onboarding: 50,
    verification: 75,
    complete: 100
  }[step];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 10
          ? [...prev, interest]
          : prev
    );
  };

  const toggleValue = (value: string) => {
    setSelectedValues(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : prev.length < 5
          ? [...prev, value]
          : prev
    );
  };

  const renderStep = () => {
    switch (step) {
      case "initial":
        return (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Madrid, España"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
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
            <Button type="submit" className="w-full font-bold" disabled={!gender || loading}>
              Continuar
            </Button>
          </form>
        );
      case "onboarding":
        const allInterests = ['Viajar', 'Yoga', 'Arte', 'Música', 'Cocinar', 'Leer', 'Deportes', 'Cine', 'Fotografía', 'Bailar'];
        const allValues = ['Honestidad', 'Amabilidad', 'Crecimiento', 'Lealtad', 'Humor', 'Aventura', 'Respeto', 'Creatividad'];

        return (
          <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label>¿Cuáles son tus intereses? (Selecciona hasta 10)</Label>
              <div className="flex flex-wrap gap-2">
                {allInterests.map(item => (
                  <Button
                    type="button"
                    key={item}
                    variant={selectedInterests.includes(item) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleInterest(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>¿Qué valores son importantes para ti? (Hasta 5)</Label>
              <div className="flex flex-wrap gap-2">
                {allValues.map(item => (
                  <Button
                    type="button"
                    key={item}
                    variant={selectedValues.includes(item) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleValue(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>
        );
      case "verification":
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto bg-primary/20 rounded-full h-20 w-20 flex items-center justify-center">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <p>Para la seguridad de todos, te pediremos una verificación con selfie más adelante. Por ahora, explora la app.</p>
            <Button onClick={handleVerificationSubmit} className="w-full font-bold">
              Explorar Alora
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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {renderStep()}
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
