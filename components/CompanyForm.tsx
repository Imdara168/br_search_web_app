"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CompanyFormData } from "@/lib/types";
import { normalizeEntityCode } from "@/lib/entity-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const companySchema = z.object({
  englishName: z
    .string()
    .min(1, "English name is required")
    .min(2, "English name must be at least 2 characters"),
  khmerName: z
    .string()
    .min(1, "Khmer name is required")
    .min(2, "Khmer name must be at least 2 characters"),
  entityCode: z.string().trim().min(1, "Entities code is required"),
});

interface CompanyFormProps {
  initialData?: CompanyFormData;
  onSubmit: (data: CompanyFormData) => void;
  isLoading?: boolean;
  submitButtonLabel?: string;
  isDuplicate?: (englishName: string, currentName?: string) => boolean;
  title?: string;
  description?: string;
  className?: string;
}

export function CompanyForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonLabel = "Create Entity",
  isDuplicate = () => false,
  title,
  description,
  className,
}: CompanyFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData || {
      englishName: "",
      khmerName: "",
      entityCode: "",
    },
  });

  const handleFormSubmit = (data: CompanyFormData) => {
    const normalizedData = {
      ...data,
      entityCode: normalizeEntityCode(data.entityCode),
    };
    const normalizedInput = data.englishName
      .toLowerCase()
      .replace(/[\s,.]/g, "");
    const normalizedCurrent =
      initialData?.englishName.toLowerCase().replace(/[\s,.]/g, "") || "";

    if (normalizedInput === normalizedCurrent) {
      onSubmit(normalizedData);
      return;
    }

    if (isDuplicate(data.englishName, initialData?.englishName)) {
      toast({
        variant: "destructive",
        title: "Duplicate Entity",
        description: "An entity with this name already exists",
      });
      return;
    }

    onSubmit(normalizedData);
  };

  return (
    <Card className={cn("bg-card border-border p-6 w-full", className)}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            English Name
          </label>
          <Input
            {...register("englishName")}
            placeholder="Enter entity name in English"
            className="bg-secondary border-border text-foreground placeholder-muted-foreground"
            disabled={isLoading}
          />
          {errors.englishName && (
            <p className="text-destructive text-sm mt-1">
              {errors.englishName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Khmer Name
          </label>
          <Input
            {...register("khmerName")}
            placeholder="Enter entity name in Khmer"
            className="bg-secondary border-border text-foreground placeholder-muted-foreground"
            disabled={isLoading}
          />
          {errors.khmerName && (
            <p className="text-destructive text-sm mt-1">
              {errors.khmerName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Entities Code
          </label>
          <Input
            {...register("entityCode")}
            placeholder="Enter Entities Code"
            className="bg-secondary border-border text-foreground placeholder-muted-foreground"
            disabled={isLoading}
          />
          {errors.entityCode && (
            <p className="text-destructive text-sm mt-1">
              {errors.entityCode.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Processing..." : submitButtonLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
