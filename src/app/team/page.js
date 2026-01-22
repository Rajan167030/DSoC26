"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChromaGrid from '../../components/ChromaGrid';
import { motion } from 'framer-motion';
import { useMotionPref } from '../../lib/motionVariants';
export default function TeamPage() {
    const { sectionVariant, fadeInUp, staggerContainer, cardVariant } = useMotionPref();

    // Organize team members by role
    const teamByRole = {
        "Program Managers": [
            {
                image: "https://avatars.githubusercontent.com/Rajan167030",
                title: "Rajan Jha",
                subtitle: "Program Manager",
                handle: "@Rajan167030",
                borderColor: "#3B82F6",
                gradient: "linear-gradient(135deg, #3B82F6, #000)",
                linkedinUrl: "https://linkedin.com/in/rajan-jha-4a921828a",
                githubUrl: "https://github.com/Rajan167030"
            },
            {
                image: "https://avatars.githubusercontent.com/aviral-mishra-63832a248",
                title: "Aviral",
                subtitle: "Program Manager",
                handle: "@aviral-mishra-63832a248",
                borderColor: "#10B981",
                gradient: "linear-gradient(165deg, #10B981, #000)",
                linkedinUrl: "https://www.linkedin.com/in/aviral-mishra-63832a248/",
                githubUrl: "https://github.com/aviral-mishra-63832a248"
            },
        ],
    };

    return (
        <div className="bg-black min-h-screen text-gray-200">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-8 max-w-7xl">
                {/* Hero Section */}
                <motion.section
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    className="mb-16 text-center"
                >
                    <motion.h1
                        variants={fadeInUp}
                        className="text-5xl md:text-6xl font-bold-custom text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                    >
                        Meet Our <span className="italic text-indigo-500">team.</span>
                    </motion.h1>
                    <motion.p
                        variants={fadeInUp}
                        className="text-xl text-gray-400 font-thin-custom max-w-3xl mx-auto"
                    >
                        A passionate group of developers, mentors, and community leaders driving DSoC 2026 forward.
                    </motion.p>
                </motion.section>

                {/* Team Sections by Role */}
                {Object.entries(teamByRole).map(([role, members], index) => (
                    <motion.section
                        key={role}
                        variants={cardVariant}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        className="mb-20"
                    >
                        {/* Role Header */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.3 }}
                            className="mb-10 text-center"
                        >
                            <motion.h2
                                variants={fadeInUp}
                                className="text-3xl md:text-3xl font-bold text-white mb-2"
                            >
                                {role}
                            </motion.h2>
                            <motion.div
                                variants={fadeInUp}
                                className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full mx-auto"
                            />
                        </motion.div>

                        {/* Team Grid */}
                        <motion.div
                            style={{ minHeight: getMinHeight(members.length), position: 'relative' }}
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            <ChromaGrid
                                items={members}
                                radius={350}
                                columns={getColumns(members.length)}
                                damping={0.45}
                                fadeOut={0.6}
                                ease="power3.out"
                            />
                        </motion.div>
                    </motion.section>
                ))}

                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <Footer />
                </motion.div>
            </div>
        </div>
    );
}

// Helper function to determine grid columns based on team size
function getColumns(memberCount) {
    if (memberCount <= 3) return 3;
    if (memberCount <= 6) return 3;
    return 3;
}

// Helper function to determine minimum height based on team size
function getMinHeight(memberCount) {
    if (memberCount <= 3) return '400px';
    if (memberCount <= 6) return '600px';
    return '800px';
}
