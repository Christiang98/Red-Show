"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Términos y Condiciones</h1>
              <p className="text-primary-foreground/70 text-sm">Red Show — Plataforma de Conexión Artística</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>

        <div className="prose max-w-none space-y-8">
          
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-5 flex gap-3">
            <Shield className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Última actualización: Febrero 2026. Al registrarte en Red Show, aceptás los siguientes términos y condiciones en su totalidad.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">1. Aceptación de los Términos</h2>
            <p className="text-foreground/80 leading-relaxed">
              Al acceder y utilizar la plataforma Red Show, el usuario acepta quedar vinculado por los presentes Términos y Condiciones. 
              Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio. 
              Nos reservamos el derecho de modificar estos términos en cualquier momento, notificando a los usuarios registrados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">2. Descripción del Servicio</h2>
            <p className="text-foreground/80 leading-relaxed">
              Red Show es una plataforma digital que conecta a artistas, emprendedores y dueños de establecimientos para facilitar 
              contrataciones y colaboraciones en el ámbito del entretenimiento y los eventos. La plataforma actúa como intermediario 
              y no es parte de los contratos celebrados entre los usuarios.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">3. Registro y Cuenta de Usuario</h2>
            <p className="text-foreground/80 leading-relaxed">
              Para utilizar Red Show debés registrarte proporcionando información veraz, precisa y actualizada. 
              Sos responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. 
              Cada persona puede tener una única cuenta activa.
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-4">
              <li>Debes ser mayor de 18 años para registrarte</li>
              <li>La información proporcionada debe ser verídica</li>
              <li>No está permitido crear cuentas falsas o suplantar identidades</li>
              <li>Eres responsable de la seguridad de tu contraseña</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">4. Uso Aceptable de la Plataforma</h2>
            <p className="text-foreground/80 leading-relaxed">
              Los usuarios se comprometen a utilizar la plataforma de manera responsable y legal. Está expresamente prohibido:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-4">
              <li>Publicar contenido falso, engañoso o fraudulento</li>
              <li>Acosar, amenazar o discriminar a otros usuarios</li>
              <li>Utilizar la plataforma para actividades ilegales</li>
              <li>Intentar acceder sin autorización a sistemas o datos</li>
              <li>Publicar contenido que viole derechos de autor de terceros</li>
              <li>Spam, publicidad no autorizada o conductas abusivas</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">5. Perfiles y Contenido Publicado</h2>
            <p className="text-foreground/80 leading-relaxed">
              Al publicar contenido en Red Show (fotos, descripciones, tarifas), el usuario garantiza que tiene los derechos 
              necesarios sobre dicho contenido y otorga a Red Show una licencia no exclusiva para mostrarlo en la plataforma. 
              Red Show se reserva el derecho de eliminar contenido que viole estos términos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">6. Contrataciones y Transacciones</h2>
            <p className="text-foreground/80 leading-relaxed">
              Red Show facilita el contacto entre partes pero no garantiza la efectividad de las contrataciones ni se hace responsable 
              por disputas entre usuarios. Los usuarios son responsables de verificar la identidad y condiciones de los acuerdos que celebren. 
              Se recomienda formalizar los acuerdos por escrito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">7. Privacidad y Datos Personales</h2>
            <p className="text-foreground/80 leading-relaxed">
              La información personal proporcionada por los usuarios será tratada conforme a la legislación vigente en materia de 
              protección de datos. El número de teléfono no se muestra públicamente para proteger la privacidad de los usuarios. 
              Los datos solo se utilizan para el funcionamiento de la plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">8. Sistema de Reseñas</h2>
            <p className="text-foreground/80 leading-relaxed">
              Las reseñas deben ser honestas y basadas en experiencias reales. Está prohibido publicar reseñas falsas, manipuladas 
              o que violen los derechos de terceros. Red Show puede eliminar reseñas que no cumplan con estos criterios.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">9. Suspensión y Cancelación</h2>
            <p className="text-foreground/80 leading-relaxed">
              Red Show se reserva el derecho de suspender o cancelar cuentas que violen estos términos, sin previo aviso en casos 
              graves. Los usuarios pueden cancelar su cuenta en cualquier momento contactando al soporte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">10. Limitación de Responsabilidad</h2>
            <p className="text-foreground/80 leading-relaxed">
              Red Show no se responsabiliza por daños directos o indirectos derivados del uso de la plataforma, 
              incluyendo pérdidas económicas por acuerdos entre usuarios. La plataforma se ofrece "tal cual está" 
              sin garantías implícitas de disponibilidad continua.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary border-b border-border pb-2">11. Contacto</h2>
            <p className="text-foreground/80 leading-relaxed">
              Para consultas sobre estos Términos y Condiciones, podés contactarnos a través de la sección de Soporte de la plataforma 
              o al correo: soporte@redshow.com.ar
            </p>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Al usar Red Show, confirmás que has leído, entendido y aceptado estos Términos y Condiciones.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/register">Crear cuenta</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
