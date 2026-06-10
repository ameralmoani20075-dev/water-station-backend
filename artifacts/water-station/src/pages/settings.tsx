import { useAuth } from "@/lib/auth";
import { 
  useChangeStationName, 
  useChangePassword,
  getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const nameSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(4, "يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type NameFormValues = z.infer<typeof nameSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const changeName = useChangeStationName();
  const changePassword = useChangePassword();

  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onNameSubmit = (data: NameFormValues) => {
    changeName.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "تم تغيير الاسم بنجاح" });
      }
    });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePassword.mutate({ 
      data: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      } 
    }, {
      onSuccess: () => {
        toast({ title: "تم تغيير كلمة المرور بنجاح" });
        passwordForm.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "فشل تغيير كلمة المرور", description: "تأكد من صحة كلمة المرور الحالية" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">تعديل معلومات الحساب وإعدادات المحطة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات المحطة</CardTitle>
          <CardDescription>تغيير اسم العرض للمحطة</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...nameForm}>
            <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>اسم المستخدم (للدخول)</Label>
                  <Input value={user?.username} disabled className="bg-muted" dir="ltr" />
                </div>
                <FormField
                  control={nameForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label>اسم المحطة (للعرض)</Label>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={changeName.isPending || !nameForm.formState.isDirty}>
                حفظ الاسم
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
          <CardDescription>احرص على استخدام كلمة مرور قوية لتأمين حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <Label>كلمة المرور الحالية</Label>
                    <FormControl>
                      <Input type="password" {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator className="my-4" />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <Label>كلمة المرور الجديدة</Label>
                    <FormControl>
                      <Input type="password" {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <Label>تأكيد كلمة المرور الجديدة</Label>
                    <FormControl>
                      <Input type="password" {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" variant="default" disabled={changePassword.isPending}>
                تحديث كلمة المرور
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
