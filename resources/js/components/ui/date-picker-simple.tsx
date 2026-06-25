"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import dayjs from "dayjs"

interface DatePickerSimpleProps {
  date?: Date
  onSelect: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
  fromYear?: number
  toYear?: number
}

export function DatePickerSimple({
  date,
  onSelect,
  label,
  placeholder = "Select date",
  id,
  className,
  disabled = false,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
}: DatePickerSimpleProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Field className={cn("w-full", className)}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? dayjs(date).format("MMMM D, YYYY") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            fromYear={fromYear}
            toYear={toYear}
            captionLayout="dropdown"
            onSelect={(selectedDate) => {
              onSelect(selectedDate)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
