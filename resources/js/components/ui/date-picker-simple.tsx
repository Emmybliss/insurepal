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
  disabledDate?: (date: Date) => boolean
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
  toYear,
  disabledDate,
}: DatePickerSimpleProps) {
  const [open, setOpen] = React.useState(false)

  const currentYear = new Date().getFullYear()
  const selectedYear = date instanceof Date ? date.getFullYear() : currentYear
  const effectiveToYear = toYear ?? Math.max(currentYear + 50, selectedYear + 10)

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
            toYear={effectiveToYear}
            captionLayout="dropdown"
            disabled={disabledDate}
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

