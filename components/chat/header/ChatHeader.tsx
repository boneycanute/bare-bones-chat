// app/components/chat/header/ChatHeader.tsx
import { FC } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ChatHeaderProps {
  credits: number;
  onUpgradeClick: () => void;
}

export const ChatHeader: FC<ChatHeaderProps> = ({
  credits,
  onUpgradeClick,
}) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="flex items-center gap-2 cursor-pointer p-2"
                onClick={onUpgradeClick}
              >
                <Coins className="h-4 w-4 text-gray-600 dark:text-white" />
                <span className="text-gray-600 dark:text-white">
                  {credits} credits
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {credits} conversations remaining.{" "}
                <button
                  onClick={onUpgradeClick}
                  className="font-bold underline cursor-pointer"
                >
                  Upgrade
                </button>
              </p>
            </TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            size="sm"
            onClick={onUpgradeClick}
            className="hidden md:inline-flex"
          >
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
};
