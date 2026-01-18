"use client";
import {useEffect, useState} from "react";
import {useFortyTwoStore} from "@/providers/forty-two-store-provider";
import {FortyTwoCorrectionSlot, FortyTwoProject} from "@/types/forty-two";
import {useCampus} from "@/contexts/CampusContext";
import {ChevronDown, ChevronLeft, ChevronRight} from "lucide-react";
import {Spinner} from "@/components/ui/spinner";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import * as React from "react";

const TableHeaderItem = (props: { text: string }) => {
    return (
        <div className="flex-1 border-r-1 justify-center items-center flex">
            <p className="text-primary">
                {props.text}
            </p>
        </div>
    )
}

const TableHours = () => {
    return (
        <div className="w-18">
            {Array.from(Array(24)).map((_, i) => (
                <div className="h-20 flex items-start border-r-1" key={i}>
                    <div className="flex items-start w-full h-5">
                        <p
                            className="text-xs text-muted-foreground px-2"
                            style={{transform: "translateY(-55%)"}}
                        >
                            {`${i.toString().padStart(2, '0')}h00`}
                        </p>
                        <div
                            className={"w-full border-b-1"}
                            style={{transform: "translateY(-1px)"}}
                        />
                    </div>

                </div>
            ))}
        </div>
    )
}

const TableDays = (props: { slots: FortyTwoCorrectionSlot[], index: number, dayStart: Date }) => {
    const convertDate = (date: string) => {
        const slot_date = new Date(date);
        return slot_date.toLocaleTimeString('fr', {
            hour: '2-digit',
            minute: "2-digit",
            timeZone: 'UTC'
        })
    }

    const getHoursFromDayStart = (slotBegin: string, dayStart: Date) => {
        const slotDate = new Date(slotBegin);
        return (slotDate.getTime() - dayStart.getTime()) / 1000 / 3600;
    }

    const getHeight = (slot: FortyTwoCorrectionSlot) => {
        const slotStart = new Date(slot.begin_at);
        const slotEnd = new Date(slot.end_at);
        return 80 * ((slotEnd.getTime() - slotStart.getTime()) / 1000 / 3600);
    };

    return (
        <div
            className="flex-1 relative overflow-hidden"
            style={{
                height: 80 * 24
            }}
        >
            {Array.from(Array(24)).map((_, i) => (
                <div className="h-20 flex items-start border-r-1 border-b-1" key={i}>

                </div>
            ))}
            {props.slots.map((slot, i) => (
                <Tooltip key={i}>
                    <TooltipTrigger asChild>
                        <div
                            className="h-50 bg-accent absolute left-0 right-0 p-2 border-1 border-l-0 overflow-hidden"
                            style={{
                                height: getHeight(slot),
                                top: 80 * getHoursFromDayStart(slot.begin_at, props.dayStart),
                                padding: getHeight(slot) > 40 ? "8px 8px":"0px 8px",
                                alignItems: getHeight(slot) > 40 ? undefined:'center',
                            }}
                        >
                            <p
                                className="text-primary"
                                style={{
                                    fontSize: getHeight(slot) > 40 ? undefined:"0.8rem",
                                }}
                            >
                                Slot available
                            </p>
                            {getHeight(slot) && (
                                <p className="text-muted text-xs">
                                    {`From ${convertDate(slot.begin_at)} to ${convertDate(slot.end_at)}`}
                                </p>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        align="center"
                        hidden={getHeight(slot) > 40}
                    >
                        <p>{`From ${convertDate(slot.begin_at)} to ${convertDate(slot.end_at)}`}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    )
}

const ProjectSelector = (props: {
    onSelect: (selection: string) => void,
    selectedProjectId: string | null,
    projects: FortyTwoProject[]
}) => {

    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    /*
    <select
                onChange={(event) => props.onSelect(event.target.value)}
            >
                {props.projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                ))}
            </select>
     */

    const getSelectedProjects = () => {
        return props.projects.find((project) => project.id.toString() === props.selectedProjectId);
    }

    return (
        <>
            <button
                className="h-10 bg-sidebar border-1 rounded-xl w-80 flex justify-between items-center overflow-hidden p-3 hover:bg-muted"
                onClick={() => setOpen(!open)}
            >
                <p>
                    {getSelectedProjects()?.name ?? "Unknown project"}
                </p>
                <ChevronDown/>
            </button>
            {open && (
                <div
                    className="h-90 bg-sidebar border-1 rounded-xl w-80 flex overflow-hidden absolute z-20 translate-y-10 shadow-lg opacity-0 duration-300 flex-col"
                    ref={(el) => {
                        if (el) {
                            requestAnimationFrame(() => {
                                el.classList.remove("opacity-0", "translate-y-10");
                                el.classList.add("opacity-100", "translate-y-12");
                            });
                        }
                    }}
                >
                    <div className={"h-12 p-3 bg-gradient-to-b from-background via-background/70 to-transparent absolute w-full"}>
                        <input
                            placeholder="Search for a project"
                            className={"bg-muted/80 p-4 rounded-full h-10 w-full backdrop-blur-xs border-1 outline-0"}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={"flex flex-col h-full overflow-scroll p-3 pt-16"}>
                        {props.projects.filter((item) => (item.name.toLowerCase().includes(searchTerm.toLowerCase()))).map((project) => (
                            <button
                                key={project.id}
                                onClick={() => {
                                    setOpen(false);
                                    setSearchTerm("");
                                    props.onSelect(project.id.toString())
                                }}
                                className={"hover:bg-muted rounded-md text-left px-3 py-2 duration-100"}
                            >
                                {project.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

const startOfISOWeekUTC = (date: Date) => {
    const d = new Date(date);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

export default function Slots() {
    const campus = useCampus();

    const projects = useFortyTwoStore(state => {
        return Object.values(state.projects).filter((project) => {
            return !project.exam
        });
    });

    const [week, setWeek] = useState<Date>(startOfISOWeekUTC(new Date()));
    const [selectedProject, setSelectedProject] = useState<string | null>(projects[0].id.toString() ?? null);

    const [loadSlots, setLoadSlots] = useState(false);
    const [slots, setSlots] = useState<any[]>([]);

    useEffect(() => {
        if (selectedProject === null)
            return;
        (async () => {
            try {
                setLoadSlots(true);

                const formated_from = `${week.getFullYear()}-${(week.getMonth() + 1).toString().padStart(2, '0')}-${(week.getDate()).toString().padStart(2, '0')}T00:00:00.000Z`;
                const to_date = new Date(week);
                to_date.setDate(to_date.getDate() + 6);
                const formated_to = `${to_date.getFullYear()}-${(to_date.getMonth() + 1).toString().padStart(2, '0')}-${(to_date.getDate()).toString().padStart(2, '0')}T23:59:59.000Z`;

                const f = await fetch(`/api/slots/${campus.userCampus}/${selectedProject}?from=${formated_from}&to=${formated_to}`);

                if (!f.ok)
                    throw new Error("Unable to fetch slots");

                const j = await f.json();

                setSlots(j);
            } catch (error) {
                console.error("Error fetching slots:", error);
            } finally {
                setLoadSlots(false);
            }
        })();
    }, [selectedProject, week])

    const formatWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);

        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

        return `Week ${weekNumber} - ${d.getUTCFullYear()}`;
    };

    const addDaysToWeek = (number: number) => {
        setWeek((prevState) => {
            const d = new Date(prevState);
            d.setDate(d.getDate() + number);
            return d;
        });
    };

    const formatDayOfWeek = (number: number) => {
        const d = new Date(week);
        d.setDate(d.getDate() + number);
        return d.toLocaleDateString("en", {day: "2-digit", month: "short"});
    }

    const getSlotsForDay = (dayIndex: number) => {
        const dayStart = new Date(week);
        dayStart.setUTCDate(dayStart.getUTCDate() + dayIndex);
        dayStart.setUTCHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setUTCHours(23, 59, 59, 999);

        return slots.filter(slot => {
            const slotStart = new Date(slot.begin_at);
            const slotEnd = new Date(slot.end_at);

            return slotStart < dayEnd && slotEnd > dayStart;
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-6 flex flex-col flex-1" style={{maxHeight: "calc(100vh - 48px)"}}>
            <div className={"flex justify-between"}>
                <ProjectSelector
                    onSelect={setSelectedProject}
                    projects={projects}
                    selectedProjectId={selectedProject}
                />
                <div
                    className="h-10 bg-sidebar border-1 rounded-xl w-50 flex justify-between items-center overflow-hidden"
                >
                    <button
                        className="aspect-square h-full border-r-1 flex items-center justify-center hover:bg-muted"
                        onClick={() => addDaysToWeek(-7)}
                    >
                        <ChevronLeft/>
                    </button>
                    <p className="text-sm text-muted-foreground">
                        {formatWeek(week)}
                    </p>
                    <button
                        className="aspect-square h-full border-l-1 flex items-center justify-center hover:bg-muted"
                        onClick={() => addDaysToWeek(7)}
                    >
                        <ChevronRight className="color-secondary"/>
                    </button>
                </div>
            </div>
            <div
                className="flex-1 flex overflow-hidden justify-center"
            >
                <div
                    className="flex-1 bg-card border-1 rounded-xl overflow-hidden flex flex-col duration-200"
                    style={{
                        opacity: loadSlots ? 0.5 : 1,
                    }}
                >
                    <div className="h-11 flex border-b-1 bg-muted">
                        <div className="w-18 border-r-1">
                        </div>
                        {Array.from(Array(7)).map((_, i) => (
                            <TableHeaderItem text={formatDayOfWeek(i)} key={i}/>
                        ))}
                    </div>
                    <div className="flex-1 overflow-scroll flex">
                        <TableHours/>
                        {Array.from(Array(7)).map((_, i) => (
                            <TableDays
                                slots={getSlotsForDay(i)}
                                dayStart={new Date(week.getTime() + i * 24 * 60 * 60 * 1000)}
                                index={i}
                                key={i}
                            />
                        ))}
                    </div>
                </div>
                {loadSlots && (
                    <Spinner
                        className={"size-12 absolute self-center duration-200"}
                        style={{
                            opacity: loadSlots ? 0.5 : 1,
                            scale: loadSlots ? 1 : 0.5,
                        }}
                    />
                )}
            </div>
        </div>
    );
}