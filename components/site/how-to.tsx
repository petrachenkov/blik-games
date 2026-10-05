import { Users, FileEdit, Hourglass } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Собери команду",
    description: "Найди напарников из своей или других учебных групп — состав команды зависит от игры.",
  },
  {
    icon: FileEdit,
    title: "Подай заявку",
    description: "Заполни форму регистрации: данные команды и каждого игрока, включая игровые ники.",
  },
  {
    icon: Hourglass,
    title: "Жди подтверждения",
    description: "Организаторы проверят заявку и подтвердят участие — следи за статусом на странице турнира.",
  },
];

export function HowToParticipate() {
  return (
    <section className="container py-16">
      <h2 className="mb-10 text-center font-display text-3xl font-bold">Как участвовать</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
              <step.icon className="h-6 w-6" />
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-display text-sm font-bold text-violet-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg font-bold">{step.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
