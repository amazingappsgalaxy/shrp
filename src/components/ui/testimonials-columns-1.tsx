"use client";

"use client";
import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-6 rounded-3xl glass-premium max-w-xs w-full" key={i}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-neon to-accent-blue flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{name}</h4>
                      <p className="text-sm text-text-secondary">{role}</p>
                    </div>
                  </div>
                  <p className="text-text-secondary mb-4 leading-relaxed">
                    "{text}"
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < 5
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};