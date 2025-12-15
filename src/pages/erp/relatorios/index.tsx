import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RelatoriosAuditoriaPage from "./auditoria";

export default function RelatoriosHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Análises e auditoria do sistema</p>
      </div>
      <Separator />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="auditoria">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
              <TabsTrigger value="vendas" disabled>Vendas (em breve)</TabsTrigger>
              <TabsTrigger value="estoque" disabled>Estoque (em breve)</TabsTrigger>
            </TabsList>

            <TabsContent value="auditoria" className="mt-6">
              <RelatoriosAuditoriaPage showHeader={false} />
            </TabsContent>

            <TabsContent value="vendas" className="mt-6">
              {/* Placeholder: conteúdo de vendas */}
              <div className="text-muted-foreground">Relatórios de vendas ainda não implementados.</div>
            </TabsContent>

            <TabsContent value="estoque" className="mt-6">
              {/* Placeholder: conteúdo de estoque */}
              <div className="text-muted-foreground">Relatórios de estoque ainda não implementados.</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
