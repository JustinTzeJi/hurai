"use client"

import { useState, ChangeEvent, MouseEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Moon, Sun, Github } from "lucide-react"
import Link from "next/link";


type AltTextResponse = {
  en?: string; // English text (optional)
  ms?: string; // Malay text (optional)
};

export default function Home() {
  const { setTheme } = useTheme()
  const [apiKey, setApiKey] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAltText, setGeneratedAltText] = useState<AltTextResponse | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const revokePreviewUrl = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl('');
    }
  };
  useEffect(() => {
    // Return the cleanup function
    return () => {
      revokePreviewUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePreviewUrl]);

  const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
    setError(null);
  };


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {

    revokePreviewUrl();
    setGeneratedAltText(null);

    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (allowedTypes.includes(file.type)) {
        setImageFile(file);
        setError(null);
        setGeneratedAltText(null);
      } else {
        setError("Invalid file type. Please upload a .jpg, .jpeg, or .png file.");
        setImageFile(null);
        event.target.value = '';
      }
    } else {
      setImageFile(null);
    }
  };


  const handleGenerateClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!apiKey.trim()) {
      setError("HuggingFace API Key is required.");
      return;
    }
    if (!imageFile) {
      setError("Please upload an image file.");
      return;
    }

    setError(null);
    setGeneratedAltText(null);
    revokePreviewUrl();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await fetch(`/api/py/generate-caption?hugging_face_api_key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (e) {
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      const objectUrl = URL.createObjectURL(imageFile);
      setGeneratedAltText(result.alt_text || "No alt text generated.");
      setImagePreviewUrl(objectUrl);

    } catch (err) {
      console.error('Error sending request:', err);
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    setApiKey('');
    setImageFile(null);
    setError(null);
    setGeneratedAltText(null);
    setIsLoading(false);
    revokePreviewUrl();

    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col flex-grow container mx-auto px-4 py-8 md:py-12">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm flex justify-between py-4">
        <div className="container mx-auto px-4 mt-auto">
          <h1 className="text-xl font-semibold">Hurai</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Generate descriptive alt text for your images.</p>
        </div>
        <div className="mx-auto mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-grow container mx-auto py-8 md:py-12">

        <div className="md:flex justify-between gap-12">
          <Card className="w-full mx-auto mb-10">
            <CardHeader>
              <CardTitle>Generate Alt Text</CardTitle>
              <CardDescription>Upload an image for generating alt text.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="hf-api-key">HuggingFace Inference API Key</Label>
                  <Input
                    id="hf-api-key"
                    type="password"
                    placeholder="Enter your HuggingFace API Key (e.g., hf_...)"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="image-upload">Upload an image (.jpg / .jpeg / .png)</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancelClick} disabled={isLoading}>Cancel</Button>
              <Button
                onClick={handleGenerateClick}
                disabled={isLoading || !apiKey || !imageFile}
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </Button>
            </CardFooter>
          </Card>


          <div className="w-full lg:row-start-1 lg:col-start-2">

            {isLoading && (
              <Card className="w-full mx-auto max-h-lg">
                <CardHeader>
                  <Skeleton className="h-6 bg-muted rounded w-3/4"></Skeleton>
                </CardHeader>
                <CardContent>
                  <Skeleton className="bg-muted rounded-md mb-4 w-full h-60"></Skeleton>
                  <div className="space-y-3 mt-4 p-3">
                    <Skeleton className="h-4 bg-muted rounded w-1/4"></Skeleton>
                    <Skeleton className="h-4 bg-muted rounded w-full"></Skeleton>
                    <Skeleton className="h-4 bg-muted rounded w-5/6"></Skeleton>
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedAltText && (<Card className="w-full mx-auto max-h-lg">
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={imagePreviewUrl} className="rounded-md mb-4 w-full h-auto object-contain max-h-60" />
                <div className="flex flex-col space-y-1.5 mt-4 p-3 rounded-md">
                  <Label>Generated Alt Text:</Label>
                  <div className="bg-muted rounded-md p-3">
                  <p className="text-sm">{generatedAltText.en}</p>
                  <p className="text-sm">{generatedAltText.ms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>)}
            {!isLoading && !generatedAltText && !imagePreviewUrl && !error && (
              <Card className="w-full mx-auto max-h-lg border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-10 min-h-[200px]">
                  <p className="text-muted-foreground text-center">Results will appear here after generation.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="top-0 z-10 border-t bg-background/80 backdrop-blur-sm flex justify-between py-2">
          <h1 className="text-sm font-semibold my-auto hidden sm:block">Powered by <a href="https://mesolitica.com/" className="underline underline-offset-4">Mesolitica</a> and <a href="https://huggingface.co/Salesforce/blip-image-captioning-large" className="underline underline-offset-4">Salesforce</a> models</h1>
          <Button variant="ghost" asChild>
            <Link href="https://github.com/JustinTzeJi/hurai">
            <Github/> Repo
            </Link>
          </Button>
      </footer>
    </div>
  );
}